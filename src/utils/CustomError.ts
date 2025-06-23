// How to use:
// const err = new CustomError('message', statusCode);
// next(err)

export default class CustomError extends Error {
  isOperational: boolean;
  status: "error" | "fail";
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message || "Something went wrong..");

    this.statusCode = statusCode;
    this.status = statusCode >= 400 && statusCode < 500 ? "fail" : "error";
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}
