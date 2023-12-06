import express, { Application } from "express";
import { errorHandler } from "./middlewares/errors";
import { json } from "body-parser";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import dotenv from "dotenv";
import cors from "cors";
import compression from "compression";
import userRoutes from "./routes/users";
import documentRoutes from "./routes/documents";
import templateRoutes from "./routes/templates";
import tagsRoutes from "./routes/tags";
import reportRoutes from "./routes/reports";
import aiRoutes from "./routes/ai";
import historyRoutes from "./routes/history";
import testRoutes from "./routes/testroutes";
import WebSocket from "ws";
import http from "http";

dotenv.config();

require("./setup").setup();

const app: Application = express(); // @ts-ignore
const server = http.createServer(app);

const port = process.env.PORT || 8000;

app.use(cors());
app.use(helmet());
app.use(json());
app.use(cookieParser());
app.use(errorHandler);
app.use(compression());

app.get("/", (req, res) => {
  return res.send("Adviser API");
});

app.use(userRoutes);
app.use(documentRoutes);
app.use(templateRoutes);
app.use(tagsRoutes);
app.use(aiRoutes);
app.use(historyRoutes);
app.use(reportRoutes);
app.use(testRoutes);

const wss = new WebSocket.Server({ server });
wss.on("connection", (ws) => {
  console.log("WebSocket connection established.");
  ws.on("message", (message) => {
    console.log(`Received message: ${message}`);
    ws.send(`Echo back: ${message}`); // simple echo for demonstration
  });
});

server.listen(port, () => {
  console.log(`Listening on port: ${port}`);
});

process.on("SIGINT", () => {
  console.log("teardown, disconnecting");
  require("./setup").teardown(); // eslint-disable-line global-require
});
