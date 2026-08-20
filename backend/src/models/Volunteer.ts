import { Schema, model, Document, Types } from 'mongoose';

export type VolunteerStatus = 'Available' | 'Busy' | 'Offline';

export interface IVolunteer extends Document {
  ngoId: Types.ObjectId | string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  status: VolunteerStatus;
  avatarUrl?: string;
  createdAt: Date;
}

const VolunteerSchema = new Schema<IVolunteer>({
  ngoId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  address: { type: String },
  status: { 
    type: String, 
    enum: ['Available', 'Busy', 'Offline'], 
    default: 'Available' 
  },
  avatarUrl: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export const Volunteer = model<IVolunteer>('Volunteer', VolunteerSchema);
export default Volunteer;
