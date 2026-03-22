const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: String,
  price: {
    type: Number,
    required: true,
  },
  category: String,
  image: String,
  isAvailable: {
    type: Boolean,
    default: true,
  },
});

const restaurantSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  phone: String,
  email: String,
  cuisine: [String],
  address: {
    street: String,
    city: String,
    pincode: String,
    coordinates: {
      lat: Number,
      lng: Number,
    },
  },
  menu: [menuItemSchema],
  isOpen: {
    type: Boolean,
    default: false,
  },
  isApproved: {
    type: Boolean,
    default: false,
  },
  rating: {
    type: Number,
    default: 0,
  },
  totalRatings: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

const Restaurant = mongoose.model("Restaurant", restaurantSchema);

module.exports = Restaurant;
