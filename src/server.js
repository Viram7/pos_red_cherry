// src/server.js
require('dotenv').config();


console.log('All environment variables:', process.env);
console.log('MONGO_URI specifically:', process.env.MONGO_URI);

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Start server
app.listen(PORT, () => {

  console.log(`Server running on http://localhost:${PORT}`);
});
