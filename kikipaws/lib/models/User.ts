import mongoose, { Schema, Document } from 'mongoose'

export interface IUser extends Document {
  clerkId: string
  email: string
  firstName: string
  lastName: string
  photo: string
  role: 'owner' | 'sitter' | 'both'
  phone?: string
  location?: string
  onboarded: boolean
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    clerkId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    photo: { type: String, default: '' },
    role: { type: String, enum: ['owner', 'sitter', 'both'], default: 'owner' },
    phone: { type: String },
    location: { type: String },
    onboarded: { type: Boolean, default: false },
  },
  { timestamps: true }
)

const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema)

export default User
