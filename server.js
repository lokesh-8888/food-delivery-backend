const express = require("express");
require("dotenv").config();
const connectDB = require("./src/config/db");
const app = require("./src/app");

// middleware
app.use(express.json());

// routes
const userRoutes = require("./src/routes/userRoutes");
app.use("/api/users", userRoutes);

app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

// Connect to database
connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode 🚀`);
});