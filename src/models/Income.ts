import mongoose, { Document, Schema } from 'mongoose'

export interface IIncome extends Document {
  _id: string
  amount: number
  description?: string
  source?: string
  date: Date
  userId: string
  createdAt: Date
  updatedAt: Date
}

const IncomeSchema = new Schema<IIncome>({
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  description: {
    type: String,
    trim: true,
  },
  source: {
    type: String,
    trim: true,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  userId: {
    type: String,
    required: true,
    ref: 'User',
  },
}, {
  timestamps: true,
})

export default mongoose.models.Income || mongoose.model<IIncome>('Income', IncomeSchema)
