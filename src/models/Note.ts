import mongoose, { Document, Schema } from 'mongoose'

export interface INote extends Document {
  _id: string
  title: string
  content: string
  tags?: string[]
  isPinned?: boolean
  color?: string
  userId: string
  createdAt: Date
  updatedAt: Date
}

const NoteSchema = new Schema<INote>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 10000,
  },
  tags: [{
    type: String,
    trim: true,
  }],
  isPinned: {
    type: Boolean,
    default: false,
  },
  color: {
    type: String,
    default: '#FFFFFF',
    trim: true,
  },
  userId: {
    type: String,
    required: true,
    ref: 'User',
  },
}, {
  timestamps: true,
})

// Index for faster queries
NoteSchema.index({ userId: 1, createdAt: -1 })
NoteSchema.index({ userId: 1, isPinned: -1, createdAt: -1 })

export default mongoose.models.Note || mongoose.model<INote>('Note', NoteSchema)

