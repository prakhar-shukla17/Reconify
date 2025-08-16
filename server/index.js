import express from 'express';
import mongoose from 'mongoose';
import hardwarerouter from './router/hardware.route.js';

const app = express();
const PORT = 3000;
app.use(express.json());
app.use("/api/hardware",hardwarerouter)
// MongoDB connection URI
const mongoUri = 'mongodb+srv://202111077:202111077@cluster0.rwwnyps.mongodb.net/';

// Connect to MongoDB
mongoose.connect(mongoUri)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


