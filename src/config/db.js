// // src/config/db.js
// const mongoose = require("mongoose");
// require("dotenv").config();

// const connectDB = async () => {
//   try {
//     await mongoose.connect(process.env.MONGO_URI);
//     console.log("MongoDB connected successfully");
//   } catch (err) {
//     console.error("MongoDB connection error:", err);
//     process.exit(1); // Exit process with failure
//   }
// };

// module.exports = connectDB;

// src/config/db.js
const mongoose = require("mongoose");
const dns = require("dns");
require("dotenv").config();

// Use public DNS servers to avoid local DNS SRV lookup failures (Atlas +srv)

try {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
} catch (err) {
  console.warn("Failed to set DNS servers:", err);
}

const connectDB = async () => {
  try {
    console.log("MONGO_URI value:", process.env.MONGO_URI);
    console.log("MONGO_URI length:", process.env.MONGO_URI?.length);
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;