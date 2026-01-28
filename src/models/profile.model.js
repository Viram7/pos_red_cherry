const mongoose = require("mongoose");

const AdminSchema = new mongoose.Schema({
  gender: { type: String, default: "" },
  mobile: { type: String, default: "" },
  photo: { type: String, default: "" },
});

const CompanySchema = new mongoose.Schema({
  name: { type: String, default: "" },
  gstn: { type: String, default: "" },
  mobile: { type: String, default: "" },
  email: { type: String, default: "" },
  address: { type: String, default: "" },
  logo: { type: String, default: "" },
  signature: { type: String, default: "" },
});

module.exports = {
  AdminSchema,
  CompanySchema,
};
