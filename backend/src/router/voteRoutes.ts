import type { Router } from 'express';
import { createVote, getVotes, getAvailablePositions, resetVotes } from '../controllers/voteController';
import { validateVote } from '../middlewares/voteValidator';

export default (router: Router) => {
  // POST /v1/votes - Criar voto (com validação)
  router.post('/votes', validateVote, createVote);

  // GET /v1/votes - Listar todos os votos
  router.get('/votes', getVotes);

  // GET /v1/available-positions - Posições disponíveis
  router.get('/available-positions', getAvailablePositions);

  // POST /v1/reset - Resetar votos (pode adicionar auth aqui depois)
  router.post('/reset', resetVotes);
}
