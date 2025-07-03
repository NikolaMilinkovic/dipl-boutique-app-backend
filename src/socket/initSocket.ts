import http from "http";
import { authenticate } from "passport";
import { Server, Socket } from "socket.io";

let io: null | Server = null;

export function getIO(): Server {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}

export function initSocket(server: http.Server): Server {
  io = new Server(server, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket: Socket) => {
    console.log("> Socket connected:", socket.id);

    socket.on("disconnect", () => {
      console.log("> Socket disconnected:", socket.id);
    });
  });

  return io;
}
