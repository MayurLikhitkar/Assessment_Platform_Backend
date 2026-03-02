import mongoose from 'mongoose';
import { DATABASE_URL } from './envConfig';
import logger from '../utils/logger';

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(DATABASE_URL);
        logger.info(`MongoDB connected: ${conn.connection.host}`);
    } catch (error) {
        logger.error('MongoDB connection error', { error });
        process.exit(1);
    }
};

export default connectDB;