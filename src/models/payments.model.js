const mongoose = require('mongoose');

// Define the schema
const paymentMethodSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    // prevent duplicate names
  },
  image: {
    type: String, // store image URL or path
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
}, {
  timestamps: true, // adds createdAt and updatedAt
});

// Create the model
const PaymentMethod = mongoose.model('PaymentMethod', paymentMethodSchema);

module.exports = PaymentMethod;
