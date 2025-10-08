import express from 'express';
import type { Router } from 'express';
import voteRoutes from './voteRoutes';
import healthRoutes from '../services/healthCheck';

const router: Router = express.Router();

export default (): Router => {
  healthRoutes(router);
  voteRoutes(router);
  return router;
}