import mongoose, { Document, Schema } from 'mongoose'

export interface ISpendingLimit extends Document {
  _id: string
  categoryId: string
  userId: string
  monthlyLimit: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const SpendingLimitSchema = new Schema<ISpendingLimit>({
  categoryId: {
    type: String,
    required: true,
    ref: 'Category',
  },
  userId: {
    type: String,
    required: true,
    ref: 'User',
  },
  monthlyLimit: {
    type: Number,
    required: true,
    min: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
})

SpendingLimitSchema.index({ userId: 1, categoryId: 1 }, { unique: true })

export default mongoose.models.SpendingLimit || mongoose.model<ISpendingLimit>('SpendingLimit', SpendingLimitSchema)
