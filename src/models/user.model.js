// src/models/user.model.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const { AdminSchema, CompanySchema } = require("./profile.model");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin"], default: "admin" }, // user/admin if needed

    resetOtp: String,
    resetOtpExpiry: Date,

    adminProfile: {
      admin: { type: AdminSchema, default: {} },
      company: { type: CompanySchema, default: {} },
    },
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

UserSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", UserSchema);
