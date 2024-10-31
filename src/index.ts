import express, { Express } from "express";
import { config } from "dotenv";
config();
import cors from "cors";
import connection from "./config/db";
import userRoutes from "./routes/userRoutes";
import errorHandler from "./middlewares/errorHandlerMiddleware";
import { handleSocketIO } from "./sockets/socket";
import http from "http";

const app: Express = express();
const PORT = process.env.PORT;

// middlewares
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// database connection
connection();

// Routes
app.use("/", userRoutes);

// Handle server error
app.use(errorHandler);

// Create an HTTP server instance
const server = http.createServer(app);

// Handle Socket.IO setup
const io = handleSocketIO(server);
app.locals.io = io;

// Start the server
server.listen(PORT, () => {
  console.info(`Server is listening on port ${PORT}`);
});
