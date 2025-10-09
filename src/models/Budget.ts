import mongoose, { Document, Schema } from 'mongoose'

export interface IBudget extends Document {
  _id: string
  name: string
  amount: number
  period: 'monthly' | 'weekly' | 'yearly'
  categoryId?: string
  userId: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const BudgetSchema = new Schema<IBudget>({
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
  period: {
    type: String,
    required: true,
    enum: ['monthly', 'weekly', 'yearly'],
    default: 'monthly',
  },
  categoryId: {
    type: String,
    ref: 'Category',
  },
  userId: {
    type: String,
    required: true,
    ref: 'User',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
})

// Create compound index for unique budget names per user per category
BudgetSchema.index({ userId: 1, categoryId: 1, name: 1 }, { unique: true })

export default mongoose.models.Budget || mongoose.model<IBudget>('Budget', BudgetSchema)
