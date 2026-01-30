// models/counter.model.ts
import mongoose, { Schema, Document } from 'mongoose';

interface ICounter extends Document {
    counterId: string;      // e.g., "user", "order", "product"
    sequence: number;
}

const counterSchema = new Schema<ICounter>({
    counterId: { type: String, required: true, unique: true },
    sequence: { type: Number, default: 0 }
});

export default mongoose.model<ICounter>('Counter', counterSchema);