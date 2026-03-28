const Razorpay = require("razorpay");

// Only initialize Razorpay if credentials are available
let razorpay = null;

if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
} else {
  // Create a mock razorpay object for testing
  razorpay = {
    orders: {
      create: async (options) => ({
        id: 'test_order_id',
        amount: options.amount,
        currency: options.currency,
        receipt: options.receipt,
        notes: options.notes
      })
    }
  };
}

module.exports = razorpay;
