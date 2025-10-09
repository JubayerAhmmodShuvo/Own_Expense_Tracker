import mongoose, { Document, Schema } from 'mongoose'

export interface IRecurringTransaction extends Document {
  _id: string
  name: string
  amount: number
  description?: string
  type: 'expense' | 'income'
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  categoryId?: string
  source?: string // For income
  startDate: Date
  endDate?: Date
  nextDueDate: Date
  isActive: boolean
  userId: string
  createdAt: Date
  updatedAt: Date
}

const RecurringTransactionSchema = new Schema<IRecurringTransaction>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  description: {
    type: String,
    trim: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['expense', 'income'],
  },
  frequency: {
    type: String,
    required: true,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    default: 'monthly',
  },
  categoryId: {
    type: String,
    ref: 'Category',
  },
  source: {
    type: String,
    trim: true,
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  endDate: {
    type: Date,
  },
  nextDueDate: {
    type: Date,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  userId: {
    type: String,
    required: true,
    ref: 'User',
  },
}, {
  timestamps: true,
})

// Create compound index for unique recurring transaction names per user
RecurringTransactionSchema.index({ userId: 1, name: 1, type: 1 }, { unique: true })

export default mongoose.models.RecurringTransaction || mongoose.model<IRecurringTransaction>('RecurringTransaction', RecurringTransactionSchema)
