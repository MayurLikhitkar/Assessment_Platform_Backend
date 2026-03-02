import mongoose, { Schema, Document } from 'mongoose';
import { generateUniqueId } from '../utils/generateId';

export interface ICategory extends Document {
    id: number;
    name: string;
    description?: string;
    type: ('aptitude' | 'coding' | 'query' | 'subjective')[];
    subCategories: string[];
    icon?: string;
    isActive: boolean;
    createdBy: number;
    createdAt: Date;
    updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
    {
        id: { type: Number, unique: true },
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },
        description: {
            type: String,
            maxlength: 500
        },
        type: [{
            type: String,
            enum: ['aptitude', 'coding', 'query', 'subjective'],
            required: true,
        }],
        subCategories: [String],
        icon: String,
        isActive: {
            type: Boolean,
            default: true
        },
        createdBy: {
            type: Number,
            required: true,
            ref: 'User'
        },
    },
    { timestamps: true }
);

// Pre-save hook to generate userId
categorySchema.pre('save', async function () {
    if (this.isNew && !this.id) {
        this.id = await generateUniqueId('category');
    }
});

export default mongoose.model<ICategory>('AssessmentCategory', categorySchema);