import mongoose, { Schema, Document } from 'mongoose'

export interface IMessage extends Document {
  bookingId: mongoose.Types.ObjectId
  senderId: mongoose.Types.ObjectId
  text: string
  readBy: mongoose.Types.ObjectId[]
  createdAt: Date
}

const MessageSchema = new Schema<IMessage>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    readBy: { type: [Schema.Types.ObjectId], default: [] },
  },
  { timestamps: true }
)

MessageSchema.index({ bookingId: 1, createdAt: -1 })

const Message = mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema)

export default Message
