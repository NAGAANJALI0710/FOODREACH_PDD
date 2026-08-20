import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import Volunteer from '../models/Volunteer';
import { mockVolunteers, mockDonations, mockUsers } from '../config/mockDb';
import { getDbStatus } from '../config/db';
import { Donation } from '../models/Donation';
import { User } from '../models/User';

export const getVolunteers = async (req: AuthenticatedRequest, res: Response) => {
  const ngoId = req.user!.id;

  try {
    const isDb = getDbStatus();
    if (isDb) {
      const volunteers = await Volunteer.find({ ngoId }).sort({ createdAt: -1 });
      return res.status(200).json({ success: true, volunteers });
    } else {
      const volunteers = mockVolunteers.filter(v => v.ngoId === ngoId);
      return res.status(200).json({ success: true, volunteers });
    }
  } catch (error: any) {
    console.error('Get volunteers error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching volunteers' });
  }
};

export const createVolunteer = async (req: AuthenticatedRequest, res: Response) => {
  const ngoId = req.user!.id;
  const { name, phone, email, address, status } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ success: false, message: 'Name and Phone are required' });
  }

  try {
    const isDb = getDbStatus();
    if (isDb) {
      const newVolunteer = await Volunteer.create({
        ngoId,
        name,
        phone,
        email: email || '',
        address: address || '',
        status: status || 'Available',
      });
      return res.status(201).json({ success: true, message: 'Volunteer created successfully', volunteer: newVolunteer });
    } else {
      const newVolunteer = {
        id: `vol_${Date.now()}`,
        ngoId,
        name,
        phone,
        email: email || '',
        address: address || '',
        status: (status || 'Available') as any,
        createdAt: new Date()
      };
      mockVolunteers.unshift(newVolunteer);
      return res.status(201).json({ success: true, message: 'Volunteer created successfully', volunteer: newVolunteer });
    }
  } catch (error: any) {
    console.error('Create volunteer error:', error);
    return res.status(500).json({ success: false, message: 'Server error creating volunteer' });
  }
};

export const updateVolunteer = async (req: AuthenticatedRequest, res: Response) => {
  const ngoId = req.user!.id;
  const { id } = req.params;
  const { name, phone, email, address, status } = req.body;

  try {
    const isDb = getDbStatus();
    if (isDb) {
      const updated = await Volunteer.findOneAndUpdate(
        { _id: id, ngoId },
        { name, phone, email, address, status },
        { new: true }
      );
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Volunteer not found' });
      }
      return res.status(200).json({ success: true, message: 'Volunteer updated successfully', volunteer: updated });
    } else {
      const index = mockVolunteers.findIndex(v => v.id === id && v.ngoId === ngoId);
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Volunteer not found' });
      }
      if (name) mockVolunteers[index].name = name;
      if (phone) mockVolunteers[index].phone = phone;
      if (email !== undefined) mockVolunteers[index].email = email;
      if (address !== undefined) mockVolunteers[index].address = address;
      if (status) mockVolunteers[index].status = status;

      return res.status(200).json({ success: true, message: 'Volunteer updated successfully', volunteer: mockVolunteers[index] });
    }
  } catch (error: any) {
    console.error('Update volunteer error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating volunteer' });
  }
};

export const deleteVolunteer = async (req: AuthenticatedRequest, res: Response) => {
  const ngoId = req.user!.id;
  const { id } = req.params;

  try {
    const isDb = getDbStatus();
    if (isDb) {
      const deleted = await Volunteer.findOneAndDelete({ _id: id, ngoId });
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Volunteer not found' });
      }
      return res.status(200).json({ success: true, message: 'Volunteer deleted successfully' });
    } else {
      const index = mockVolunteers.findIndex(v => v.id === id && v.ngoId === ngoId);
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Volunteer not found' });
      }
      mockVolunteers.splice(index, 1);
      return res.status(200).json({ success: true, message: 'Volunteer deleted successfully' });
    }
  } catch (error: any) {
    console.error('Delete volunteer error:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting volunteer' });
  }
};

export const getPickups = async (req: AuthenticatedRequest, res: Response) => {
  const volunteerId = req.user!.id;
  try {
    const isDb = getDbStatus();
    let donations: any[] = [];
    if (isDb) {
      donations = await Donation.find({
        volunteerId,
        status: { $nin: ['Completed', 'Cancelled'] }
      }).populate('donorId ngoId', 'name contactNumber address gpsLocation').sort({ createdAt: -1 });
    } else {
      donations = mockDonations.filter(d => 
        d.volunteerId === volunteerId && 
        !['Completed', 'Cancelled'].includes(d.status)
      );
    }
    return res.status(200).json({ success: true, pickups: donations });
  } catch (error: any) {
    console.error('Get pickups error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching pickups' });
  }
};

export const getLeaderboard = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const isDb = getDbStatus();
    let leaderboard: any[] = [];
    if (isDb) {
      const dbVolunteers = await User.find({ role: 'volunteer' })
        .select('name volunteerScore completedPickups')
        .sort({ volunteerScore: -1 })
        .limit(10);
      leaderboard = dbVolunteers.map(v => ({
        name: v.name,
        volunteerScore: v.volunteerScore || 0,
        completedPickups: v.completedPickups || 0
      }));
    } else {
      const mockVols = mockUsers.filter(u => u.role === 'volunteer');
      mockVols.sort((a, b) => (b.volunteerScore || 0) - (a.volunteerScore || 0));
      leaderboard = mockVols.slice(0, 10).map(v => ({
        name: v.name,
        volunteerScore: v.volunteerScore || 0,
        completedPickups: v.completedPickups || 0
      }));
    }
    return res.status(200).json({ success: true, leaderboard });
  } catch (error: any) {
    console.error('Get leaderboard error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching leaderboard' });
  }
};
