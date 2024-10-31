import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

const getS3 = () => {
  return new S3Client({
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    },
    region: process.env.AWS_REGION as string,
  });
};

export const getPreSignedUrl = async (key: string) => {
  try {
    const s3 = getS3();
    const getObjectParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    };
    const command = new GetObjectCommand(getObjectParams);
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    return url;
  } catch (error) {
    throw new Error("Failed to get URL from S3");
  }
};

export const uploadFilesToS3 = async (files: any[], folder: string) => {
  const s3 = getS3();

  const uploadedFiles: {}[] = [];

  const uploadPromises = files.map(async (file: any) => {
    try {
      const key = `${folder}/${uuidv4()}.jpg`;

      const params = {
        Bucket: process.env.AWS_BUCKET_NAME as string,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      const command = new PutObjectCommand(params);
      await s3.send(command);

      uploadedFiles.push({
        originalName: file.originalname,
        key: key,
        type: file.mimetype,
      });
    } catch (error) {
      console.log(error);
      throw new Error(`Failed to upload file ${file.originalname}`);
    }
  });

  // Wait for all file uploads to complete
  await Promise.all(uploadPromises);
  return uploadedFiles;
};

export const deleteFileFromS3 = async (key: string) => {
  try {
    const s3 = getS3();
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME as string,
      Key: key,
    };

    const command = new DeleteObjectCommand(params);

    await s3.send(command);

    return true;
  } catch (error) {
    throw new Error("Failed to delete file from S3");
  }
};
