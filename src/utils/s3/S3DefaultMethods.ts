/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-invalid-void-type */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";
import sharp from "sharp";

import CustomError from "../utils/CustomError.js";
import { betterConsoleLog, betterErrorLog } from "../utils/logMethods.js";
import s3 from "./S3Client.js";

const bucketName = process.env.BUCKET_NAME ?? "";
const bucketRegion = process.env.BUCKET_REGION ?? "";

interface FileType {
  buffer: Buffer;
  mimetype: string;
}

async function deleteMediaFromS3(path: string, imageName: string, next?: (err: Error) => void): Promise<void> {
  try {
    const params = {
      Bucket: bucketName,
      Key: `${path}${imageName}`,
    };
    const command = new DeleteObjectCommand(params);
    const result = await s3.send(command);

    if (result.$metadata.httpStatusCode !== 204) {
      betterConsoleLog("> Error while deleting the image from the S3 bucket", result);
    }
  } catch (error: any) {
    const statusCode = error.statusCode ?? 500;
    betterErrorLog("> Error deleting media from the s3 bucket:", error);
    if (next) {
      next(new CustomError("Došlo je do problema prilikom brisanja slike", statusCode));
      return;
    }
  }
}

function getCurrentDate(): string {
  return new Date().toLocaleDateString("en-UK").replace(/\//g, "-");
}

function randomImageName(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

function resizeImage(buffer: Buffer, x = 1080, y = 1920): Promise<Buffer> {
  return sharp(buffer).resize({ fit: "contain", height: y, width: x }).toBuffer();
}

async function uploadFileToS3(path: string, file: FileType, next: (err: Error) => void): Promise<void | { fileName: string; uri: string }> {
  try {
    const fileName = `orders-for-${getCurrentDate()}.xlsx`;
    const params = {
      ACL: "public-read" as const,
      Body: file.buffer,
      Bucket: bucketName,
      ContentType: file.mimetype,
      Key: `${path}${fileName}`,
    };

    const command = new PutObjectCommand(params);
    const s3Response = await s3.send(command);

    if ((s3Response.$metadata.httpStatusCode ?? 500) === 200) {
      return {
        fileName,
        uri: `https://${bucketName}.s3.${bucketRegion}.amazonaws.com/${path}${fileName}`,
      };
    } else {
      next(new CustomError("There was a problem uploading the Excel file", s3Response.$metadata.httpStatusCode ?? 500));
      return;
    }
  } catch (error: any) {
    const statusCode = error.statusCode ?? 500;
    betterErrorLog("> Error uploading file to the s3 bucket:", error);
    next(new CustomError("Došlo je do problema prilikom uploadovanja fajla", statusCode));
    return;
  }
}

async function uploadMediaToS3(path: string, file: FileType, next: (err: Error) => void): Promise<void | { imageName: string; uri: string }> {
  try {
    const modifiedImageBuffer = await resizeImage(file.buffer, 480, 640);
    const imageName = `${randomImageName()}.jpeg`;

    const params = {
      ACL: "public-read" as const,
      Body: modifiedImageBuffer,
      Bucket: bucketName,
      ContentType: file.mimetype,
      Key: `${path}${imageName}`,
    };

    const command = new PutObjectCommand(params);
    const s3Response = await s3.send(command);

    if ((s3Response.$metadata.httpStatusCode ?? 0) === 200) {
      return {
        imageName,
        uri: `https://${bucketName}.s3.${bucketRegion}.amazonaws.com/${path}${imageName}`,
      };
    } else {
      next(new CustomError("Došlo je do problema prilikom uploadovanja slike", s3Response.$metadata.httpStatusCode ?? 500));
      return;
    }
  } catch (error: any) {
    const statusCode = error.statusCode ?? 500;
    betterErrorLog("> Error uploading media to the s3 bucket:", error);
    next(new CustomError("Došlo je do problema prilikom uploadovanja slike", statusCode));
    return;
  }
}

export { deleteMediaFromS3, uploadFileToS3, uploadMediaToS3 };
