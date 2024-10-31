import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HttpServer } from "http";

export const handleSocketIO = (server: HttpServer) => {
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ["GET", "POST", "PUT", "DELETE"],
    },
  });

  io.on("connection", (socket: Socket) => {
    console.log("A user connected:", socket.id);

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  return io;
};
