import mongoose, { Document, Schema } from 'mongoose'

export interface ITag extends Document {
  _id: string
  name: string
  color?: string
  userId: string
  createdAt: Date
  updatedAt: Date
}

const TagSchema = new Schema<ITag>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  color: {
    type: String,
    default: '#6B7280',
  },
  userId: {
    type: String,
    required: true,
    ref: 'User',
  },
}, {
  timestamps: true,
})

// Create compound index for unique tag names per user
TagSchema.index({ userId: 1, name: 1 }, { unique: true })

export default mongoose.models.Tag || mongoose.model<ITag>('Tag', TagSchema)
