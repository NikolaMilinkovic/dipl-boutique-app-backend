import { S3Client } from "@aws-sdk/client-s3";

// import dotenv from "dotenv";
// dotenv.config();
if (process.env.NODE_ENV !== "production") {
  const dotenv = await import("dotenv");
  dotenv.config();
}

const bucketRegion = process.env.BUCKET_REGION ?? "";
const accessKey = process.env.ACCESS_KEY ?? "";
const secretAccessKey = process.env.SECRET_ACCESS_KEY ?? "";

const s3 = new S3Client({
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretAccessKey,
  },
  region: bucketRegion,
});

export default s3;
