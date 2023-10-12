import express, { Application } from "express";
import { errorHandler } from "./middlewares/errors";
import { json } from "body-parser";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import dotenv from "dotenv";
import cors from "cors";
import userRoutes from "./routes/users";
import documentRoutes from "./routes/documents";
import aiRoutes from "./routes/ai";

dotenv.config();

require("./setup").setup();

const app: Application = express();
const port = process.env.PORT || 8000;

app.use(cors());
app.use(helmet());
app.use(json());
app.use(cookieParser());
app.use(errorHandler);

app.get("/", (req, res) => {
  return res.send("Community API");
});

app.use(userRoutes);
app.use(documentRoutes);
app.use(aiRoutes);

app.listen(port, () => {
  console.log(`Listening on port: ${port}`);
});

process.on("SIGINT", () => {
  require("./setup").teardown(); // eslint-disable-line global-require
});
