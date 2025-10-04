import express from 'express';
import type { Router } from 'express';
import voteRoutes from './voteRoutes';

const router: Router = express.Router();

export default (): Router => {
  voteRoutes(router);
  return router;
}