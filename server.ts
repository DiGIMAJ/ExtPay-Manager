import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import expressLayouts from 'express-ejs-layouts';
import dotenv from 'dotenv';

// Routes
import authRoutes from './src/routes/auth.ts';
import dashboardRoutes from './src/routes/dashboard.ts';
import apiRoutes from './src/routes/api.ts';
import paymentRoutes from './src/routes/payment.ts';
import licenseRoutes from './src/routes/license.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Trust proxy is required for secure cookies behind a proxy
app.set('trust proxy', 1);

// EJS Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Global locals
app.use((req, res, next) => {
    if (!process.env.APP_URL) {
        console.warn('WARNING: APP_URL environment variable is not set. Some features like payment redirects may fail.');
    }
    res.locals.appUrl = process.env.APP_URL || '';
    next();
});

// Routes
app.use('/', authRoutes);
app.use('/', dashboardRoutes);
app.use('/api', apiRoutes);
app.use('/', paymentRoutes);
app.use('/', licenseRoutes);

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
