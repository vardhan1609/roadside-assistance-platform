import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import requestRoutes from './routes/requests.js';
import adminRoutes from './routes/admin.js';
import mechanicRoutes from './routes/mechanic.js';
import fs from 'fs';

dotenv.config();

const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/mechanic', mechanicRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Roadside Assistance API Running' });
});


// Connect to MongoDB
// mongoose.connect(process.env.MONGO_URI)
//   .then(() => {
//     console.log('Connected to MongoDB Atlas');
//     const PORT = process.env.PORT || 5000;
//     app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
//   })
//   .catch(err => {
//     console.error('MongoDB connection error:', err.message);
//     process.exit(1);
//   });

function getEnvVariable(key) {
  const secretPath = `/run/secrets/${key.toLowerCase()}`;
  
  // If Docker secret exists, use it
  if (fs.existsSync(secretPath)) {
    return fs.readFileSync(secretPath, 'utf8').trim();
  }

  // Otherwise fallback to environment variable (.env)
  return process.env[key];
}

const mongoURI = getEnvVariable('MONGO_URI');

if (!mongoURI) {
  console.error('MONGO_URI not found in environment variables or Docker secrets');
  process.exit(1);
}

// Connect to MongoDB
mongoose.connect(mongoURI)
  .then(() => {
    console.log('Connected to MongoDB Atlas');
        const HOST = '0.0.0.0'; // Bind to all network interfaces
        const PORT = process.env.PORT || 5000;


    // const PORT = process.env.PORT || 5000||HOST;
    app.listen(PORT,HOST, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
