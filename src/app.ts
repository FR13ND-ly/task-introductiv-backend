import express, { Application } from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import cors from 'cors';
import morgan from 'morgan';
import fileRoutes from './routes/fileRoutes';
const app: Application = express();


// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(morgan('dev'));
app.use(cors({origin: '*'}));

// Servim fișierele salvate
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/files', fileRoutes);
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

export default app;