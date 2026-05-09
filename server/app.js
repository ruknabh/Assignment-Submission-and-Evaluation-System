import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import ApiError from './src/utils/ApiError.js';
import errorHandler from './src/middleware/errorHandler.js';
import authRoutes from "./src/routes/auth.routes.js";

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Health check route
app.get('/health', async (req, res) => {
  res.json({ status: 'Server is running' });
});


// Routes
app.use('/api/auth', authRoutes);



// 404 — catches any request that didn't match a route above
app.use((req, res, next) => {
  next(new ApiError(404, `Route ${req.method} ${req.path} not found`));
});


// Global error handler — must be last
app.use(errorHandler);

export default app;