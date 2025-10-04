import type { Request, Response, NextFunction } from "express";
import { maxPositions } from "../main";

export const validateVote = (req: Request, res: Response, next: NextFunction): void | Response => {
  const { pilotId, pilotName, position } = req.body;

  if(!pilotId || !pilotName || !position) {
    return res.status(400).json({
      error: 'pilotId, pilotName and position are required',
      required: ['pilotId', 'pilotName', 'position']
    });
  }

  if(typeof pilotId !== 'string' || typeof pilotName !== 'string') {
    return res.status(400).json({
      error: 'pilotId and pilotName must be strings'
    });
  }

  if(typeof position !== 'number') {
    return res.status(400).json({
      error: 'position must be a number'
    });
  }

  if(position < 1 || position > maxPositions) {
    return res.status(400).json({
      error: `position must be between 1 and ${maxPositions}`
    });
  }

  if(pilotName.trim().length === 0) {
    return res.status(400).json({
      error: 'pilotName cannot be empty'
    });
  }

  next();
}