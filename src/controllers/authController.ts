import { Request, Response, NextFunction } from "express";
import User from "../models/userModel";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { AppError, AppResponse } from "../utils/appUtils";

// Handle user signup/register
export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email, password } = req.body;

    const trimmedEmail = email.trim();
    const trimmedName = name.trim();

    if (!email || !name || !password) {
      throw new AppError(400, "Email, name and password is required");
    }

    const userExist = await User.findOne({ email: trimmedEmail });

    if (userExist) {
      throw new AppError(409, "User already exist");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      email: trimmedEmail,
      name: trimmedName,
      password: hashedPassword,
    });

    await newUser.save();

    new AppResponse(res, 201, "New user is created");
  } catch (error) {
    next(error);
  }
};

// Handle user login
export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;
    const trimmedEmail = email.trim();

    if (!email || !password) {
      throw new AppError(400, "Email and password are required");
    }

    const user = await User.findOne({ email: trimmedEmail });

    if (!user) {
      throw new AppError(404, "User do not exist");
    }

    const passwordValid = await bcrypt.compare(password, user.password || "");

    if (!passwordValid) {
      throw new AppError(401, "Invalid password, please try again");
    }

    const payload = {
      userId: user._id,
      iat: Date.now(),
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET as string, {
      expiresIn: "30d",
    });

    await user.save();

    new AppResponse(res, 200, "User logged in successfully", {
      token,
      userData: {
        isUser: true,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};
