import { Request, Response, NextFunction } from "express";
import { AppError, AppResponse } from "../utils/appUtils";
import User from "../models/userModel";
import jwt from "jsonwebtoken";

export const authorizeUser = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.headers.authorization) {
    throw new AppError(401, "Token do not exist");
  }

  const [_, token] = req.headers.authorization.split(" ");

  jwt.verify(
    token,
    process.env.JWT_SECRET as string,
    async (err, decoded: any) => {
      if (err) {
        throw new AppError(401, "Unauthorized: Invalid token");
      }

      const user = await User.findOne({ _id: decoded.userId });

      if (!user) throw new AppError(401, "Unauthorized: User not found");

      res.locals.userId = decoded.userId;

      next();
    }
  );
};

export const isLoggedIn = (req: Request, res: Response, next: NextFunction) => {
  if (!req.headers.authorization) {
    throw new AppError(401, "Token do not exist");
  }

  const [_, token] = req.headers.authorization.split(" ");

  jwt.verify(
    token,
    process.env.JWT_SECRET as string,
    async (err, decoded: any) => {
      if (err) {
        throw new AppError(401, "Unauthorized: Invalid token");
      }

      const user = await User.findOne({ _id: decoded.userId });

      if (!user) throw new AppError(401, "Unauthorized: User not found");

      new AppResponse(res, 200, "User is logged-in", {
        userData: {
          isUser: true,
          email: user.email,
        },
      });
    }
  );
};
