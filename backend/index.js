import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Store drawing history
let drawingHistory = [];

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("A user connected");

  // Send drawing history to newly connected user
  socket.emit("drawing_history", drawingHistory);

  // Handle drawing event
  socket.on("draw", (data) => {
    // Save to drawing history
    drawingHistory.push(data);
    // Broadcast the drawing data to all other clients
    socket.broadcast.emit("draw", data);
  });

  // Handle clear canvas event
  socket.on("clear_canvas", () => {
    drawingHistory = [];
    socket.broadcast.emit("clear_canvas");
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
