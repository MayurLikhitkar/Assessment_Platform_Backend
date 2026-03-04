import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/authRoutes';
import assessmentRoutes from './routes/assessmentsRoutes';
import connectDB from './config/connectDB';
import { ALLOWED_ORIGIN, PORT } from './config/envConfig';
import errorHandler from './middleware/errorHandler';
import { HttpStatus } from './utils/constants';
import logger from './utils/logger';


const app = express();

// Connect to database
connectDB();

// Middleware
app.use(helmet());
app.use(cors({
    origin: ALLOWED_ORIGIN || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/assessments', assessmentRoutes);

// Health check
app.get('/health', (req, res) => {
    return res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
    return res.json({ message: 'Server running', success: true, timestamp: new Date().toISOString() });
});

app.use((req, res) => {
    return res.status(HttpStatus.NOT_FOUND).json({ message: 'Route not found', success: false });
});

app.use(errorHandler);

app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
});