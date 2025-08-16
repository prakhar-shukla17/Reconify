import express from 'express';

const app = express();
const PORT = 3000;

app.use(express.json());


app.post('/hardware', (req, res) => {
  const hardwareData = req.body;
  console.log('Received hardware data:', JSON.stringify(hardwareData, null, 2));
  res.status(200).json({ message: 'Hardware data received and printed to console' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
