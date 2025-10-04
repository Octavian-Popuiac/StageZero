import express from 'express';
import type { Express, Response, Request} from 'express';
import dotenv from 'dotenv';
import router from './router';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import type Vote from './interfaces/Vote';

dotenv.config();

const app: Express = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3002'],
    credentials: true
  }
});

const PORT = process.env.PORT;

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3002'],
  credentials: true
}))

app.use(express.json());

// Estado da votação
const votes: Vote[] = [];
const maxPositions = 10;

// Middleware para passar io para as rotas
app.use((req: Request, res: Response, next) => {
  (req as any).io = io;
  next();
});

app.use('/v1', router());

app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'StageZero API is running'
  })
});

io.on('connection', (socket) => {
  console.log('A user connected: ', socket.id);

  socket.emit('currentVotes', votes);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export { votes, io, maxPositions };