import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { placeTeam, timeInCentiseconds } from '../dist/rally.js';

test('cascade fills the nearest slot below, then above when required', () => {
  assert.deepEqual(placeTeam([1, 2, null, null], 3, 1), [3, 1, 2, null]);
  assert.deepEqual(placeTeam([null, 1, 2, 3], 4, 3), [1, 2, 4, 3]);
  assert.equal(timeInCentiseconds('1:59:99'), 11999);
  assert.equal(timeInCentiseconds('2:00.1'), 12010);
});

test('local API waits for the start, previews live, confirms once and persists the grid', { timeout: 15000 }, async () => {
  const directory = await mkdtemp(join(tmpdir(), 'stagezero-test-'));
  const database = join(directory, 'rally.sqlite');
  let server;
  let abort;
  async function start() {
    server = spawn(process.execPath, ['--disable-warning=ExperimentalWarning', 'dist/main.js'], {
      env: { ...process.env, PORT: '0', HOST: '127.0.0.1', STAGEZERO_DB: database },
      stdio: ['ignore', 'pipe', 'inherit'],
    });
    const [line] = await Promise.race([
      once(server.stdout, 'data'),
      once(server, 'exit').then(([code]) => { throw Error(`Servidor terminou com código ${code}`); }),
    ]);
    return `http://127.0.0.1:${line.toString().match(/:(\d+)/)[1]}`;
  }

  async function stop() {
    if (server?.exitCode === null) {
      const stopped = once(server, 'exit');
      server.kill();
      await stopped;
    }
  }

  try {
    let url = await start();
    const request = (path, method, body) => fetch(url + '/v1' + path, {
      method,
      ...(method && {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body ?? {}),
      }),
    });
    const getState = async () => (await request('/state')).json();
    assert.equal((await request('/start-list.pdf')).status, 409);
    assert.equal((await request('/start', 'POST')).status, 409);
    for (const [number, time] of [[7, '2:00:01'], [12, '2:00:58']]) {
      const response = await request('/teams', 'POST', {
        number, time, pilotName: `Pilot ${number}`, navigatorName: 'Navigator',
        carBrand: 'FORD', pilotCountry: 'Portugal', navigatorCountry: 'Spain',
      });
      assert.equal(response.status, 200);
    }
    let state = await getState();
    assert.equal(state.started, false);
    assert.equal(state.selectingCompetitor, null);
    assert.equal((await request('/confirm', 'POST', { number: 12, revision: state.revision })).status, 409);
    assert.equal((await request('/selection', 'PUT', { number: 12, position: 2, revision: state.revision })).status, 409);
    assert.equal(state.startPositions.every(slot => !slot.competitor), true);

    abort = new AbortController();
    const stream = await fetch(url + '/v1/events', { signal: abort.signal });
    assert.match(stream.headers.get('content-type'), /text\/event-stream/);
    const reader = stream.body.getReader();
    let buffer = '';
    async function getEvent() {
      while (!buffer.includes('\n\n')) {
        const chunk = await reader.read();
        assert.equal(chunk.done, false);
        buffer += new TextDecoder().decode(chunk.value);
      }
      const index = buffer.indexOf('\n\n');
      const message = buffer.slice(0, index);
      buffer = buffer.slice(index + 2);
      return JSON.parse(message.slice(6));
    }

    assert.equal((await getEvent()).revision, state.revision);
    assert.equal((await request('/start', 'POST')).status, 200);
    state = await getEvent();
    assert.equal(state.started, true);
    assert.equal(state.selectingCompetitor.number, 12);
    assert.equal((await request('/start', 'POST')).status, 409);
    assert.equal((await request('/teams/12', 'DELETE')).status, 409);
    const selection = await request('/selection', 'PUT', { number: 12, position: 2, revision: state.revision });
    assert.equal(selection.status, 200);
    state = await getEvent();
    assert.equal(state.previewPositions[1].competitor.number, 12);
    assert.equal(state.startPositions[1].competitor, null);
    const confirm = { number: 12, revision: state.revision };
    assert.equal((await request('/confirm', 'POST', confirm)).status, 200);
    assert.equal((await request('/confirm', 'POST', confirm)).status, 409);
    state = await getEvent();
    assert.equal(state.startPositions[1].competitor.number, 12);
    assert.equal(state.selectingCompetitor.number, 7);
    assert.equal((await request('/teams/12', 'DELETE')).status, 409);
    assert.equal((await request('/start-list.pdf')).status, 409);

    abort.abort();
    await stop();
    url = await start();
    assert.deepEqual(await getState(), state);
    assert.equal((await request('/confirm', 'POST', { number: 7, revision: state.revision })).status, 200);
    const final = await getState();
    assert.equal(final.selectingCompetitor, null);
    assert.deepEqual(final.startPositions.slice(0, 2).map(slot => slot.competitor.number), [7, 12]);
    const exportResponse = await request('/start-list.pdf');
    assert.equal(exportResponse.status, 200);
    assert.match(exportResponse.headers.get('content-type'), /^application\/pdf/);
    assert.match(exportResponse.headers.get('content-disposition'), /attachment;.*stagezero-ordem-partida-ss1.pdf/);
    const pdf = Buffer.from(await exportResponse.arrayBuffer()).toString('latin1');
    assert.match(pdf, /^%PDF-/);
    assert.match(pdf, /%%EOF/);
    assert.equal((pdf.match(/\/Type \/Page\b/g) ?? []).length, 1);
    assert.equal((await request('/reset', 'POST')).status, 200);
    assert.equal((await request('/start-list.pdf')).status, 409);
    const reset = await getState();
    assert.equal(reset.started, false);
    assert.equal(reset.selectingCompetitor, null);
    assert.equal(reset.competitors.length, 2);
    assert.equal((await request('/start', 'POST')).status, 200);
    assert.equal((await getState()).selectingCompetitor.number, 12);
  } finally {
    abort?.abort();
    await stop();
    await rm(directory, { recursive: true, force: true });
  }
});
