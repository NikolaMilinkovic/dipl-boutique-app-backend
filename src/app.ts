import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import mongoose from "mongoose";
import logger from "morgan";
import path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";

// import dotenv from "dotenv";
// dotenv.config();
if (process.env.NODE_ENV !== "production") {
  const dotenv = await import("dotenv");
  dotenv.config();
}
const app = express();

app.use(helmet());

let allowedOrigins: string[] = [];
if (process.env.NODE_ENV === "production") {
  if (process.env.ALLOWED_ORIGINS_PRODUCTION) {
    allowedOrigins = process.env.ALLOWED_ORIGINS_PRODUCTION.split(",");
  } else {
    throw new Error("CORS origins not defined for production");
  }
} else if (process.env.NODE_ENV === "development") {
  if (process.env.ALLOWED_ORIGINS_DEVELOPMENT) {
    allowedOrigins = process.env.ALLOWED_ORIGINS_DEVELOPMENT.split(",");
  } else {
    throw new Error("CORS origins not defined for development");
  }
}
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  }),
);

// view engine setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// ===========================[ MongoDB connection ]=========================== //
const conn_string = process.env.DB_URI ?? "";
if (!conn_string) {
  console.error("[ERROR] Missing DB connection string");
  process.exit(1);
}
mongoose.connect(conn_string).catch((error: unknown) => {
  betterErrorLog("> MongoDB connection error: ", error);
});
const database = mongoose.connection;

database.once("open", () => {
  console.log("> Connected to database");
});

database.on("error", console.error.bind(console, "> MongoDB connection error"));
// ===========================[ \MongoDB connection ]=========================== //

// import { addUserOnStartup } from "../src/utils/helperMethods.js";
// await addUserOnStartup("helvos", "helvos");

import authModuleFactory, { AuthModule } from "./middleware/authMiddleware.js";
const authModule: AuthModule = authModuleFactory();

// =====================[ UNPROTECTED ROUTES ]=====================
app.post("/login", authModule.login);

import agentRouter from "./routes/agent.js";
app.use("/agent", agentRouter);
// =====================[ \UNPROTECTED ROUTES ]====================

app.use(authModule.authenticateJWT);

// =====================[ PROTECTED ROUTERS ]======================
import colorsRouter from "./routes/colors.js";
app.use("/colors", colorsRouter);

import categoriesRouter from "./routes/category.js";
app.use("/category", categoriesRouter);

import suppliersRouter from "./routes/supplier.js";
app.use("/supplier", suppliersRouter);

import couriersRouter from "./routes/courier.js";
app.use("/courier", couriersRouter);

import productsRouter from "./routes/products.js";
app.use("/product", productsRouter);

import ordersRouter from "./routes/orders.js";
app.use("/orders", ordersRouter);

import usersRouter from "./routes/user.js";
app.use("/user", usersRouter);

// =====================[ ERROR HANDLERS ]======================
import errorHandler from "./controllers/errorControler.js";
import { betterErrorLog } from "./utils/logMethods.js";
app.use(errorHandler);
// =====================[ \ERROR HANDLERS ]=====================

export default app;
