import mongoose, { Schema, Document } from 'mongoose'

export interface IReview extends Document {
  bookingId: mongoose.Types.ObjectId
  reviewerId: mongoose.Types.ObjectId
  sitterId: mongoose.Types.ObjectId
  sitterProfileId: mongoose.Types.ObjectId
  rating: 1 | 2 | 3 | 4 | 5
  comment?: string
  createdAt: Date
  updatedAt: Date
}

const ReviewSchema = new Schema<IReview>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    reviewerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sitterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sitterProfileId: { type: Schema.Types.ObjectId, ref: 'SitterProfile', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 500 },
  },
  { timestamps: true }
)

ReviewSchema.index({ sitterProfileId: 1 })
ReviewSchema.index({ sitterId: 1 })

const Review = mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema)

export default Review
