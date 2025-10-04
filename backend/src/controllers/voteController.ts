import type { Request, Response } from "express";
import { votes, io, maxPositions } from "../main";
import type Vote from "../interfaces/Vote";
import type VoteRequest from "../interfaces/VoteRequest";

export const createVote = (req: Request, res: Response): Response => {
  const { pilotId, pilotName, position }: VoteRequest = req.body;

  const existingVote = votes.find(v => v.pilotId === pilotId);
  if (existingVote) {
    return res.status(400).json({ message: 'Pilot has already voted' });
  }

  const positionTaken = votes.find(v => v.position === position);
  if (positionTaken) {
    return res.status(400).json({ message: 'Position already taken' });
  }

  const newVote: Vote = {
    pilotId,
    pilotName,
    position,
    timestamp: new Date()
  };

  votes.push(newVote);

  io.emit('newVote', newVote);
  io.emit('currentVotes', votes);

  return res.status(201).json({
    message: 'Vote created successfully',
    vote: newVote
  });
};

export const getVotes = (req: Request, res: Response): Response => {
  return res.json(votes.sort((a,b) => a.position - b.position));
};

export const getAvailablePositions = (req: Request, res: Response): Response => {
  const takenPositions = votes.map(v => v.position);
  const available = Array.from({ length: maxPositions}, (_, i) => i +1)
    .filter(pos => !takenPositions.includes(pos));

  return res.json(available);
};

export const resetVotes = (req: Request, res: Response): Response => {
  votes.length = 0;
  io.emit('resetVotes');
  io.emit('currentVotes', votes);
  return res.json({ message: 'All votes have been reset' });
};
