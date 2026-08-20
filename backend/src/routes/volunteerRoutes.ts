import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import {
  getVolunteers,
  createVolunteer,
  updateVolunteer,
  deleteVolunteer,
  getPickups,
  getLeaderboard
} from '../controllers/volunteerController';

const router = Router();

// Volunteer specific actions
router.get('/pickups', protect as any, getPickups as any);
router.get('/leaderboard', protect as any, getLeaderboard as any);

// NGO CRUD actions for internal volunteers
router.get('/', protect as any, getVolunteers as any);
router.post('/', protect as any, createVolunteer as any);
router.put('/:id', protect as any, updateVolunteer as any);
router.delete('/:id', protect as any, deleteVolunteer as any);

export default router;
