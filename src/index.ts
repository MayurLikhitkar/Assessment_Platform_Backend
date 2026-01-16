import express from 'express';
import cors from 'cors';
// import helmet from 'helmet';
// import { errorHandler } from './middleware/error';
import authRoutes from './routes/authRoutes';
// import categoryRoutes from './routes/categories';
// import assessmentRoutes from './routes/assessments';
import connectDB from './config/connectDB';
import { ALLOWED_ORIGIN, PORT } from './config/envConfig';


const app = express();

// Connect to database
connectDB();

// Middleware
// app.use(helmet());
app.use(cors({
    origin: ALLOWED_ORIGIN || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
// app.use('/api/categories', categoryRoutes);
// app.use('/api/assessments', assessmentRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Error handler
// app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});