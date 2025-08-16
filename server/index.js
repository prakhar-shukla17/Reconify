import express from 'express';
import mongoose from 'mongoose';
import hardwarerouter from './router/hardware.route.js';
import { configDotenv } from 'dotenv';

configDotenv()
const app = express();
const PORT = process.env.PORT;
app.use(express.json());
app.use("/api/hardware",hardwarerouter)
// MongoDB connection URI
const mongoUri = process.env.MONGODB_URI;

// Connect to MongoDB
mongoose.connect(mongoUri)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


