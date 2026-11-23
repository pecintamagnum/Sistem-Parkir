const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
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

// Sajikan file static frontend (opsional jika dibuka langsung di port 5000)
app.use(express.static(path.join(__dirname, '../frontend')));

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
