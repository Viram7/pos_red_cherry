const mongoose = require("mongoose");

const AdminSchema = new mongoose.Schema({
  gender: { type: String, required: true },
  mobile: { type: String, required: true },
  photo: { type: String, default: "" },
});

const CompanySchema = new mongoose.Schema({
  name: { type: String, required: true },
  gstn: { type: String, required: true },
  mobile: { type: String, required: true },
  email: { type: String, required: true },
  address: { type: String, required: true },
  logo: { type: String, default: "" },
  signature: { type: String, default: "" },
});

module.exports = {
  AdminSchema,
  CompanySchema,
};
