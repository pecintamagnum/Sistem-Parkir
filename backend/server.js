require('dotenv').config();
const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/index');
const { notFoundHandler, globalErrorHandler } = require('./middlewares/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware Global
app.use(cors({
  origin: '*', // Memungkinkan akses dari frontend teman (port 3000, 5173, live server, dll.)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rute Utama API
app.use('/api', apiRoutes);

// Root Welcome Route
app.get('/', (req, res) => {
  res.send(`
    <div style="font-family: sans-serif; text-align: center; padding-top: 50px;">
      <h1>🚗 API Sistem Parkir Aktif</h1>
      <p>Backend Express.js + MySQL siap digunakan untuk UKK RPL Paket 2.</p>
      <p>Silakan akses endpoint <code><a href="/api">/api</a></code>.</p>
    </div>
  `);
});

// Error Handling Middlewares
app.use(notFoundHandler);
app.use(globalErrorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚗 SERVER SISTEM PARKIR BERJALAN`);
  console.log(`📡 URL API     : http://localhost:${PORT}/api`);
  console.log(`⚙️  Environment : ${process.env.NODE_ENV || 'development'}`);
  console.log(`====================================================`);
});
