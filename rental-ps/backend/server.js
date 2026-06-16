const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const admin = require('firebase-admin');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());


// ================= FRONTEND =================
app.use(express.static(path.join(__dirname, 'public')));

// ================= HOME =================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
// ================= FIREBASE =================
const serviceAccount = JSON.parse(
  Buffer.from(
    process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
    'base64'
  ).toString('utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL:
    'https://rental-ps-60fea-default-rtdb.asia-southeast1.firebasedatabase.app/'
});

const realtimeDB = admin.database();

// ================= AIVEN =================
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false
  }
});

// ================= HOME =================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// ================= GET BOOKINGS =================
app.get('/bookings', async (req, res) => {

  try {

    const result = await pool.query(
      'SELECT * FROM bookings ORDER BY id DESC'
    );

    res.json(result.rows);

  } catch(err){

    console.log(err);

    res.status(500).json({
      error: err.message
    });

  }

});

// ================= BOOKING =================
app.post('/booking', async (req, res) => {

  try {

    const {
      nama,
      ps,
      durasi,
      harga,
      waktu
    } = req.body;

    await pool.query(
      `INSERT INTO bookings
      (nama, ps, durasi, harga, waktu, status)
      VALUES ($1,$2,$3,$4,$5,$6)`,

      [
        nama,
        ps,
        durasi,
        harga,
        waktu,
        'Dipakai'
      ]
    );

    await realtimeDB.ref('bookings').push({
      nama,
      ps,
      durasi,
      harga,
      waktu,
      status: 'Dipakai'
    });

    res.json({
      success: true
    });

  } catch(err){

    console.log(err);

    res.status(500).json({
      error: err.message
    });

  }

});

// ================= AUTO UPDATE =================
setInterval(async () => {

  try {

    const result = await pool.query(
      'SELECT * FROM bookings WHERE status = $1',
      ['Dipakai']
    );

    const sekarang = new Date();

    for(const item of result.rows){

      const dibuat = new Date(item.waktu);

      const selesai = new Date(
        dibuat.getTime() + item.durasi * 60 * 60 * 1000
      );

      if(sekarang >= selesai){

        await pool.query(
          'UPDATE bookings SET status = $1 WHERE id = $2',
          ['Selesai', item.id]
        );

      }

    }

  } catch(err){

    console.log(err);

  }

}, 5000);

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 URL: http://localhost:${PORT}`);
});