import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import userRoute from "./routes/userRouter";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "./swagger.json";
import "dotenv/config";

export class App {
  public server: express.Application;

  constructor() {
    this.server = express();
    this.listen();
    this.middleware();
    this.swagger();
    this.routes();
    this.database();
  }

  public getApp() {
    return this.server;
  }

  private listen() {
    this.server.listen(process.env.API_PORT, () => {
      console.log(`Api connect in port ${process.env.API_PORT}`);
    });
  }

  private middleware() {
    this.server.use(express.json());
    this.server.use(cors());
  }

  private swagger() {
    this.server.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  }

  public routes() {
    this.server.use(userRoute);
  }

  private database() {
    mongoose.connect(`${process.env.MONGO_URL}`, { useUnifiedTopology: true, useNewUrlParser: true }).then(() => {
      console.log("Database connected!");
    }).catch((err) => {
      console.log(err);
    });
  }
}