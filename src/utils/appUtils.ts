import { Response } from "express";

class AppError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string, data: any = {}) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

class AppResponse {
  constructor(
    res: Response,
    statusCode = 200,
    message = "Request success",
    data = {}
  ) {
    res.status(statusCode).json({
      success: true,
      message,
      ...data,
    });
  }
}

export { AppError, AppResponse };
