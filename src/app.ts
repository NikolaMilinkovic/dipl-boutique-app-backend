import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import express from "express";
import createError from "http-errors";
import logger from "morgan";
import path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";
dotenv.config();

const app = express();

// view engine setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Kako bih skratio relativne putanje mogu da koristim #
// Ovo mi omogucava postavka u package.json
// "imports": {
//   "#*": "./src/*"
// },
import indexRouter from "#routes/index.js";
app.use("/", indexRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.json({
    error: process.env.NODE_ENV === "development" ? err : {},
    message: err.message,
  });
});

console.log("> Application started.");

export default app;
