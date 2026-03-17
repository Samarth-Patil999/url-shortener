require('dotenv').config();
const express = require('express');
const cors = require('cors');
const shortenRoute = require('./routes/shorten');
const redirectRoute = require('./routes/redirect');
const authRoute = require('./routes/auth');
const { ping: dbPing } = require('../config/db');
const { ping: redisPing } = require('../config/redis');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', async (req, res) => {
  const [db, cache] = await Promise.all([dbPing(), redisPing()]);
  const status = db && cache ? 200 : 503;
  res.status(status).json({ db, cache, uptime: process.uptime() });
});

app.use('/api/auth', authRoute);
app.use('/api/shorten', shortenRoute);
app.use('/', redirectRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
