import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HttpServer } from "http";

export const userSockets: { [userId: string]: string } = {};

export const handleSocketIO = (server: HttpServer) => {
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ["GET", "POST", "PUT", "DELETE"],
    },
  });

  io.on("connection", (socket: Socket) => {
    const userId: string = socket.handshake.query.userId as string;

    if (userId && userId !== "undefined") {
      userSockets[userId] = socket.id;
      console.log(`User ${userId} is registered with socket ${socket.id}`);
    }

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);

      // clean up userSockets by removing the disconnected socket
      for (const userId in userSockets) {
        if (userSockets[userId] === socket.id) {
          delete userSockets[userId];
        }
      }
    });
  });

  return io;
};
