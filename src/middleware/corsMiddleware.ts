import cors from "cors";

export function createCorsMiddleware() {
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

  return cors({
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
  });
}
