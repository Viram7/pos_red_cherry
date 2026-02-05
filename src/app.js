// src/app.js
const express = require("express");
const cors = require("cors");

// Route imports
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const productRoutes = require("./routes/product.routes");
const categoryRoutes = require("./routes/category.routes");
const brandRoutes = require("./routes/brand.routes");
const discountRoutes = require("./routes/discount.routes");
const paymentRoutes = require("./routes/payment.routes");
const warehouseRoutes = require("./routes/warehouse.routes");
const invoiceRoutes = require("./routes/bill.routes");
const orderRoutes = require("./routes/createOrder.routes");

const taxRoutes = require("./routes/tax.routes");
const financerRoutes = require("./routes/fainencer.routes");

const schemeSeasonRoutes = require("./routes/schemeSeason.routes");
const customerRoutes = require("./routes/customer.routes");





const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/discounts", discountRoutes);
app.use("/api/payment-methods", paymentRoutes);
app.use("/api/warehouses", warehouseRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api", orderRoutes);

app.use("/api/tax", taxRoutes);
app.use("/api/financer", financerRoutes);
app.use("/api/schemeSeason", schemeSeasonRoutes);
app.use("/api/customers", customerRoutes);


// MONGO_URI=mongodb://localhost:27017/pos_backend

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

module.exports = app;
