import mongoose, { Document, Schema } from 'mongoose'

export interface ICategory extends Document {
  _id: string
  name: string
  description?: string
  color?: string
  userId: string
  createdAt: Date
  updatedAt: Date
}

const CategorySchema = new Schema<ICategory>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  color: {
    type: String,
    default: '#3B82F6',
  },
  userId: {
    type: String,
    required: true,
    ref: 'User',
  },
}, {
  timestamps: true,
})

// Create compound index for unique category names per user
CategorySchema.index({ userId: 1, name: 1 }, { unique: true })

export default mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema)
