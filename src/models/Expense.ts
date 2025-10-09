import mongoose, { Document, Schema } from 'mongoose'

export interface IExpense extends Document {
  _id: string
  amount: number
  description?: string
  date: Date
  categoryId?: string
  tags?: string[]
  userId: string
  createdAt: Date
  updatedAt: Date
}

const ExpenseSchema = new Schema<IExpense>({
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  description: {
    type: String,
    trim: true,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  categoryId: {
    type: String,
    ref: 'Category',
  },
  tags: [{
    type: String,
    ref: 'Tag',
  }],
  userId: {
    type: String,
    required: true,
    ref: 'User',
  },
}, {
  timestamps: true,
})

export default mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema)
