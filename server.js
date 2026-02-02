const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const rooms = new Map();

const generateRoomCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

const getRoomPayload = (room) =>
  room.players.map((p) => ({
    name: p.name,
    color: p.color
  }));

const notifyRoomPlayers = (roomCode) => {
  const room = rooms.get(roomCode);
  if (!room) return;
  room.players.forEach((player, index) => {
    io.to(player.socketId).emit("roomUpdate", {
      roomCode,
      players: getRoomPayload(room),
      playerId: index
    });
  });
};

app.use(express.static(path.join(__dirname)));

io.on("connection", (socket) => {
  socket.on("createRoom", ({ name, color }) => {
    let roomCode = generateRoomCode();
    while (rooms.has(roomCode)) roomCode = generateRoomCode();

    const room = {
      hostId: socket.id,
      players: [{ socketId: socket.id, name, color }],
      state: null
    };

    rooms.set(roomCode, room);
    socket.join(roomCode);

    socket.emit("roomCreated", {
      roomCode,
      players: getRoomPayload(room),
      playerId: 0,
      isHost: true
    });
  });

  socket.on("joinRoom", ({ roomCode, name, color }) => {
    const room = rooms.get(roomCode);
    if (!room) {
      socket.emit("roomError", { message: "Room not found." });
      return;
    }

    room.players.push({ socketId: socket.id, name, color });
    socket.join(roomCode);

    socket.emit("roomJoined", {
      roomCode,
      players: getRoomPayload(room),
      playerId: room.players.length - 1,
      isHost: false,
      playerName: name
    });

    notifyRoomPlayers(roomCode);

    if (room.state) {
      socket.emit("stateUpdate", { state: room.state });
    }
  });

  socket.on("stateUpdate", ({ roomCode, state }) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    if (room.hostId !== socket.id) return;
    room.state = state;
    io.to(roomCode).emit("stateUpdate", { state });
  });

  socket.on("action", ({ roomCode, action, playerId }) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    io.to(room.hostId).emit("actionRequest", { action, playerId });
  });

  socket.on("disconnect", () => {
    rooms.forEach((room, code) => {
      const index = room.players.findIndex((p) => p.socketId === socket.id);
      if (index !== -1) {
        room.players.splice(index, 1);
        if (room.hostId === socket.id) {
          const newHost = room.players[0];
          room.hostId = newHost ? newHost.socketId : null;
        }
        if (room.players.length === 0) {
          rooms.delete(code);
        } else {
          notifyRoomPlayers(code);
        }
      }
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
