const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const ApiError = require("../utils/ApiResponse").ApiError;

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      credentials: true
    }
  });

  // JWT authentication middleware
  io.use((socket, next) => {
    try {
      let token = socket.handshake.auth.token;
      
      // If token not found in auth, try to get from cookie
      if (!token && socket.handshake.headers.cookie) {
        const cookies = socket.handshake.headers.cookie.split(';').reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split('=');
          acc[key] = value;
          return acc;
        }, {});
        
        token = cookies.token;
      }
      
      if (!token) {
        return next(new Error("Unauthorized - No token provided"));
      }
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded; // contains id, role, name
      next();
    } catch (error) {
      next(new Error("Unauthorized - Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id} — User: ${socket.user.name}`);

    // Handle join_room event
    socket.on("join_room", ({ roomId }) => {
      socket.join(roomId);
      console.log(`${socket.user.name} joined room: ${roomId}`);
    });

    // Handle location_update event (delivery agents only)
    socket.on("location_update", ({ lat, lng, orderId }) => {
      // Validate user is delivery agent
      if (socket.user.role !== "delivery_agent") {
        return socket.emit("error", { message: "Unauthorized - Only delivery agents can update location" });
      }
      
      // Validate lat and lng are numbers
      if (typeof lat !== "number" || typeof lng !== "number") {
        return socket.emit("error", { message: "Invalid coordinates" });
      }
      
      // Emit agent_location to order room
      io.to(`order_${orderId}`).emit("agent_location", {
        lat,
        lng,
        updatedAt: new Date()
      });
    });

    // Handle disconnect event
    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  console.log("Socket.io server initialized");
}

module.exports = {
  initSocket,
  getIO: () => io
};
