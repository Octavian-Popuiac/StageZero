import type { Router, Request, Response } from 'express';

export default (router: Router) => {
  router.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'StageZero Backend'
    });
  });

  router.get('/ping', (req: Request, res: Response) => {
    res.status(200).send('pong');
  });
}