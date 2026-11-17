require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const originesAutorisees = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());
app.use(cors({ origin: originesAutorisees }));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ statut: 'ok' });
});

app.use('/auth', require('./routes/auth'));
app.use('/etudiant', require('./routes/etudiant'));
app.use('/admin', require('./routes/admin'));
app.use('/professeur', require('./routes/professeur'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend demarre sur http://localhost:${PORT}`);
});