import express, { type ErrorRequestHandler, type Response } from 'express';
import { mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { startListPdf } from './startListPdf.js';
import { emptyGrid, parseTeam, placeTeam, SLOT_COUNT, snapshot, type Rally } from './rally.js';

const databasePath = process.env.STAGEZERO_DB ?? fileURLToPath(new URL('../../data/stagezero.sqlite', import.meta.url));
if (databasePath !== ':memory:') mkdirSync(dirname(databasePath), { recursive: true });
const db = new DatabaseSync(databasePath);
db.exec('PRAGMA busy_timeout = 3000; CREATE TABLE IF NOT EXISTS rally (id INTEGER PRIMARY KEY CHECK (id = 1), state TEXT NOT NULL)');
db.prepare('INSERT OR IGNORE INTO rally VALUES (1, ?)').run(JSON.stringify({
  revision: 0, started: false, teams: [], grid: emptyGrid(), position: 1,
} satisfies Rally));
const read = db.prepare('SELECT state FROM rally WHERE id = 1');
const save = db.prepare('UPDATE rally SET state = ? WHERE id = 1');
function getRally(): Rally {
  const stored = JSON.parse(read.get()?.state as string) as Omit<Rally, 'started'> & { started?: boolean };
  // A grelha nas instalações anteriores já podia ter votos sem um início explícito.
  return { ...stored, started: stored.started ?? stored.grid.some(number => number !== null) };
}

class RequestError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

const app = express();
app.disable('x-powered-by');
const api = express.Router();
app.use('/v1', api);
api.use(express.json({ limit: '32kb' }));
api.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  if (['GET', 'HEAD'].includes(req.method)) return next();
  const origin = req.get('Origin');
  if (origin && origin !== `http://${req.get('Host')}`) {
    return next(new RequestError(403, 'Origem do pedido inválida.'));
  }
  if (!req.is('application/json')) return next(new RequestError(415, 'O pedido deve conter JSON.'));
  next();
});

const clients = new Set<Response>();
const event = (state: ReturnType<typeof snapshot>) => `data: ${JSON.stringify(state)}\n\n`;

function change(res: Response, update: (rally: Rally) => void) {
  db.exec('BEGIN IMMEDIATE');
  let state: ReturnType<typeof snapshot>;
  try {
    const rally = getRally();
    update(rally);
    rally.revision++;
    state = snapshot(rally);
    save.run(JSON.stringify(rally));
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
  for (const client of clients) client.write(event(state));
  res.json(state);
}

api.get(['/health', '/ping', '/'], (_req, res) => res.json({ status: 'ok' }));
api.get('/state', (_req, res) => res.json(snapshot(getRally())));
api.get('/start-list.pdf', async (_req, res) => {
  const state = snapshot(getRally());
  if (!state.started || !state.eligibleCount || state.selectingCompetitor) {
    throw new RequestError(409, 'A exportação fica disponível depois de todas as equipas elegíveis confirmarem.');
  }
  const pdf = await startListPdf(state);
  res.attachment('stagezero-ordem-partida-ss1.pdf').send(pdf);
});
api.get('/events', (_req, res) => {
  res.set({ 'Content-Type': 'text/event-stream', 'X-Accel-Buffering': 'no' });
  res.flushHeaders();
  res.write(event(snapshot(getRally())));
  clients.add(res);
  const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 15000);
  res.on('close', () => {
    clearInterval(heartbeat);
    clients.delete(res);
  });
});

function ensureBeforeVoting(rally: Rally) {
  if (rally.started) {
    throw new RequestError(409, 'Reinicia as posições antes de alterar as equipas.');
  }
}

api.use(['/teams', '/start', '/reset'], (req, _res, next) => {
  const peer = req.socket.remoteAddress;
  if (peer !== '127.0.0.1' && peer !== '::1' && peer !== '::ffff:127.0.0.1') {
    return next(new RequestError(403, 'A gestão de equipas e posições está disponível no computador do evento.'));
  }
  next();
});

api.post('/teams', (req, res) => change(res, rally => {
  ensureBeforeVoting(rally);
  const team = parseTeam(req.body);
  if (!team) throw new RequestError(400, 'Verifica os dados da equipa e o tempo do prólogo (mm:ss:cc).');
  if (rally.teams.some(item => item.number === team.number)) throw new RequestError(409, 'Já existe uma equipa com esse número.');
  rally.teams.push(team);
  rally.position = 1;
}));

api.put('/teams/:number', (req, res) => change(res, rally => {
  ensureBeforeVoting(rally);
  const team = parseTeam(req.body);
  const index = rally.teams.findIndex(item => item.number === Number(req.params.number));
  if (!team || team.number !== Number(req.params.number)) throw new RequestError(400, 'Verifica os dados da equipa e o tempo do prólogo (mm:ss:cc).');
  if (index === -1) throw new RequestError(404, 'Equipa não encontrada.');
  rally.teams[index] = team;
  rally.position = 1;
}));

api.delete('/teams/:number', (req, res) => change(res, rally => {
  ensureBeforeVoting(rally);
  const index = rally.teams.findIndex(item => item.number === Number(req.params.number));
  if (index === -1) throw new RequestError(404, 'Equipa não encontrada.');
  rally.teams.splice(index, 1);
  rally.position = 1;
}));

api.delete('/teams', (_req, res) => change(res, rally => {
  ensureBeforeVoting(rally);
  rally.teams = [];
  rally.position = 1;
}));

api.post('/start', (_req, res) => change(res, rally => {
  if (rally.started) throw new RequestError(409, 'A escolha já foi iniciada.');
  if (!rally.teams.length) throw new RequestError(409, 'Adiciona pelo menos uma equipa antes de iniciar.');
  rally.started = true;
}));

api.put('/selection', (req, res) => change(res, rally => {
  const { number, position, revision } = req.body ?? {};
  if (!Number.isInteger(position) || position < 1 || position > SLOT_COUNT) {
    throw new RequestError(400, 'Posição inválida.');
  }
  ensureCurrent(rally, number, revision);
  rally.position = position;
}));

function ensureCurrent(rally: Rally, number: unknown, revision: unknown) {
  if (!rally.started) throw new RequestError(409, 'A organização ainda não iniciou a escolha.');
  const team = snapshot(rally).selectingCompetitor;
  if (!team || team.number !== number || rally.revision !== revision) {
    throw new RequestError(409, 'A escolha mudou. Verifica a equipa e a posição atuais.');
  }
  return team;
}

api.post('/confirm', (req, res) => change(res, rally => {
  const team = ensureCurrent(rally, req.body?.number, req.body?.revision);
  rally.grid = placeTeam(rally.grid, team.number, rally.position);
  rally.position = 1;
}));

api.post('/reset', (_req, res) => change(res, rally => {
  rally.grid = emptyGrid();
  rally.started = false;
  rally.position = 1;
}));

api.use((_req, res) => res.status(404).json({ message: 'Rota desconhecida.' }));

const frontend = fileURLToPath(new URL('../../frontend/dist', import.meta.url));
if (existsSync(resolve(frontend, 'index.html'))) {
  app.use(express.static(frontend));
  app.get(['/display', '/controller'], (_req, res) => res.sendFile(resolve(frontend, 'index.html')));
} else {
  app.get('/', (_req, res) => res.type('text').send('StageZero API. Usa make run para compilar e servir a interface.'));
}

const handleError: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof RequestError) {
    res.status(error.status).json({ message: error.message });
  } else if (error.status === 400 || error.status === 413) {
    res.status(error.status).json({ message: 'Pedido inválido ou demasiado grande.' });
  } else {
    console.error(error);
    res.status(500).json({ message: 'Não foi possível guardar a alteração.' });
  }
};
app.use(handleError);

const port = Number(process.env.PORT ?? 8000);
const host = process.env.HOST ?? '0.0.0.0';
const server = app.listen(port, host, () => {
  const address = server.address();
  console.log(`StageZero em http://localhost:${typeof address === 'object' && address ? address.port : port}`);
});
