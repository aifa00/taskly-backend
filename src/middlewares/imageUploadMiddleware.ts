import { Request, Response, NextFunction } from "express";
import sharp from "sharp";
import multer from "multer";

const storage = multer.memoryStorage();

export const upload = multer({ storage: storage });

export const processImages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // If no files, skip processing
  if (!req.files) return next();

  try {
    // Create an array to hold processed images
    const processedImages = await Promise.all(
      (req.files as any).map(async (file: any) => {
        const processedBuffer = await sharp(file.buffer)
          .resize({ width: 1600, height: 1000, fit: sharp.fit.cover }) // Crop to 16:10 aspect ratio
          .toFormat("jpeg", { quality: 80 }) // Compress and convert to JPEG with 80% quality
          .toBuffer();

        return {
          originalname: file.originalname,
          buffer: processedBuffer,
          mimetype: "image/jpeg",
        };
      })
    );

    req.files = processedImages;
    next();
  } catch (error) {
    next(error);
  }
};
