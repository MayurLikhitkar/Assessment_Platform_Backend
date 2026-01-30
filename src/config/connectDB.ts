import mongoose from 'mongoose';
import { DATABASE_URL } from './envConfig';

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(DATABASE_URL);

        console.log(`===> MongoDB(Database) Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error('MongoDB(Database) connection error:', error);
        process.exit(1);
    }
};

export default connectDB;