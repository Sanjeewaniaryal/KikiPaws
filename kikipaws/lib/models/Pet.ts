import mongoose, { Schema, Document } from 'mongoose'

export interface IPet extends Document {
  userId: mongoose.Types.ObjectId
  name: string
  breed: string
  age: number
  size: 'small' | 'medium' | 'large' | 'xlarge'
  notes?: string
  photo?: string
  createdAt: Date
  updatedAt: Date
}

const PetSchema = new Schema<IPet>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    breed: { type: String, required: true },
    age: { type: Number, required: true },
    size: { type: String, enum: ['small', 'medium', 'large', 'xlarge'], required: true },
    notes: { type: String },
    photo: { type: String },
  },
  { timestamps: true }
)

const Pet = mongoose.models.Pet || mongoose.model<IPet>('Pet', PetSchema)

export default Pet
