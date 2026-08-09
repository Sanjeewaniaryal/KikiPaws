import mongoose, { Schema, Document } from 'mongoose'

export interface IAvailabilityDay {
  available: boolean
  from: string // 'HH:MM'
  to: string
}

export interface ISitterProfile extends Document {
  userId: mongoose.Types.ObjectId
  bio: string
  services: ('sitting' | 'walking' | 'boarding' | 'dropin' | 'grooming')[]
  hourlyRate: number
  location: string
  experience: string
  averageRating: number
  reviewCount: number
  profilePhoto?: string
  availability: {
    mon: IAvailabilityDay; tue: IAvailabilityDay; wed: IAvailabilityDay
    thu: IAvailabilityDay; fri: IAvailabilityDay; sat: IAvailabilityDay; sun: IAvailabilityDay
  }
  createdAt: Date
  updatedAt: Date
}

const SitterProfileSchema = new Schema<ISitterProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    bio: { type: String, default: '' },
    services: {
      type: [String],
      enum: ['sitting', 'walking', 'boarding', 'dropin', 'grooming'],
      default: [],
    },
    hourlyRate: { type: Number, default: 0 },
    location: { type: String, default: '' },
    experience: { type: String, default: '' },
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    profilePhoto: { type: String },
    availability: {
      type: Object,
      default: () => {
        const day = { available: false, from: '09:00', to: '17:00' }
        return { mon: { ...day }, tue: { ...day }, wed: { ...day }, thu: { ...day }, fri: { ...day }, sat: { ...day }, sun: { ...day } }
      },
    },
  },
  { timestamps: true }
)

const SitterProfile =
  mongoose.models.SitterProfile ||
  mongoose.model<ISitterProfile>('SitterProfile', SitterProfileSchema)

export default SitterProfile
