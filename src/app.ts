import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import logger from "morgan";
import path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();

app.use(cors());

// view engine setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// ===============[ MongoDB connection ]=============== //
const conn_string = process.env.DB_URI ?? "";
if (!conn_string) {
  console.error("[ERROR] Missing DB connection string");
  process.exit(1);
}
mongoose
  .connect(conn_string)
  .then(() => {
    // initializeAppSettings();
    // initializeProductDisplayCounter();
    // initializeLastUpdatedTracker();
  })
  .catch((error: unknown) => {
    console.error("MongoDB connection error", error);
  });
const database = mongoose.connection;

database.once("open", () => {
  console.log("> Connected to database");
});

database.on("error", console.error.bind(console, "mongo connection error"));
// ===============[ \MongoDB connection ]=============== //

import { addUserOnStartup } from "#utils/helperMethods.js";
await addUserOnStartup("helvos", "helvos");

import authModuleFactory, { AuthModule } from "#middleware/authMiddleware.js";
const authModule: AuthModule = authModuleFactory();

// =====================[ UNPROTECTED ROUTES ]=====================
app.post("/login", authModule.login);
// app.post('/verify-user', authModule.verifyUser);
// =====================[ \UNPROTECTED ROUTES ]=====================

// =====================[ PROTECTED ROUTERS ]======================
app.use(authModule.authenticateJWT);

// =====================[ ERROR HANDLERS ]======================
import errorHandler from "./controllers/errorControler.js";
app.use(errorHandler);
// =====================[ \ERROR HANDLERS ]=====================

export default app;
