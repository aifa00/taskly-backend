import { Request, Response, NextFunction } from "express";
import { AppError, AppResponse } from "../utils/appUtils";
import Task from "../models/taskModel";
import {
  deleteFileFromS3,
  getPreSignedUrl,
  uploadFilesToS3,
} from "../utils/S3Utils";
import mongoose from "mongoose";

export const getTasks = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status } = req.query;

    const query: any = {};

    // Handle: Filter
    if (status) {
      if (status === "overdue") {
        query.dueDate = { $lt: new Date() };
      } else if (
        ["pending", "in-progress", "completed", "blocked"].includes(
          status as string
        )
      ) {
        query.status = status;
      }
    }

    const tasks = await Task.find(query, {
      title: 1,
      status: 1,
      priority: 1,
      dueDate: 1,
    });

    // Task status analytics
    const taskData: any = {
      pending: tasks.reduce(
        (acc, task: any) => (task.status === "pending" ? acc + 1 : acc),
        0
      ),
      "in-progress": tasks.reduce(
        (acc, task: any) => (task.status === "in-progress" ? acc + 1 : acc),
        0
      ),
      completed: tasks.reduce(
        (acc, task: any) => (task.status === "completed" ? acc + 1 : acc),
        0
      ),
      blocked: tasks.reduce(
        (acc, task: any) => (task.status === "blocked" ? acc + 1 : acc),
        0
      ),
    };

    new AppResponse(res, 200, "Tasks loaded successfully", {
      tasks,
      taskData,
    });
  } catch (error) {
    next(error);
  }
};

export const addNewTask = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { title, description, status, startDate, dueDate, priority } =
      req.body;
    const io = req.app.locals.io;
    const userId = res.locals.userId;
    const files = (req as any).files;
    const folder = "attachments";

    if (!title) {
      throw new AppError(400, "Title is required to create task");
    }

    // Check task with same name
    const task = await Task.findOne({
      title: new RegExp(`^${title.trim()}$`, "i"),
    });

    if (task) {
      throw new AppError(409, "Task with same title exist !");
    }

    //Upload files to s3 if exist
    let uploadedFiles: {}[] = [];

    if (files.length > 0) {
      uploadedFiles = await uploadFilesToS3(files, folder);
    }

    const newTask = new Task({
      title: title.trim(),
      description,
      attachments: uploadedFiles,
      status: status,
      startDate: new Date(startDate),
      priority,
      userId: new mongoose.Types.ObjectId(userId as string),
    });

    if (dueDate) {
      newTask.dueDate = new Date(dueDate);
    }

    await newTask.save();

    // Emit to all connected clients
    io.emit("taskAdded", {
      _id: newTask._id,
      title: newTask.title,
      status: newTask.status,
      priority: newTask.priority,
      dueDate: newTask.dueDate,
    });

    new AppResponse(res, 201, "Task added successfully");
  } catch (error) {
    next(error);
  }
};

export const getEditTask = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { taskId } = req.params;

    let task: any = await Task.findById(taskId);

    if (!task) throw new AppError(409, "Task doesn't exist !");

    // Get ataachment's urls
    const attachmentsWithUrls = await Promise.all(
      task?.attachments?.map(async (file: any) => {
        const url = await getPreSignedUrl(file.key);
        return { _id: file._doc._id, key: file._doc.key, imageUrl: url };
      })
    );

    // Replace atachments array
    task = {
      ...task.toObject(),
      attachments: attachmentsWithUrls,
    };

    new AppResponse(res, 200, "Task retreived successfully", {
      task,
    });
  } catch (error) {
    next(error);
  }
};

export const editTask = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { taskId } = req.params;
    const {
      title,
      description,
      deletedFileKeys,
      status,
      startDate,
      dueDate,
      priority,
    } = req.body;
    const io = req.app.locals.io;

    if (!title) {
      throw new AppError(400, "Title is required");
    }

    // Check for task with same name
    const taskExist = await Task.findOne({
      _id: { $ne: new mongoose.Types.ObjectId(taskId as string) },
      title: new RegExp(`^${title.trim()}$`, "i"),
    });

    if (taskExist) {
      throw new AppError(409, "Task with the same name already exist !");
    }

    const task: any = await Task.findById(taskId);

    const oldStatus = task.status;

    task.title = title.trim();
    task.description = description;
    task.status = status;
    if (startDate) task.startDate = new Date(startDate);
    if (dueDate) task.dueDate = new Date(dueDate);
    task.priority = priority;

    if (deletedFileKeys && deletedFileKeys.length > 0) {
      await Promise.all(
        deletedFileKeys.map(async (key: string) => {
          await deleteFileFromS3(key);
        })
      );

      task.attachments = task.attachments.filter(
        (file: any) => !deletedFileKeys.includes(file.key)
      );
    }

    await task.save();

    io.emit("taskUpdated", {
      _id: task._id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      oldStatus,
    });

    new AppResponse(res, 200, "Task updated successfully");
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { taskId } = req.params;
    const io = req.app.locals.io;

    const task = await Task.findById(taskId, "attachments status");

    if (!task) {
      throw new AppError(400, "Task not found!");
    }

    const attachments = task?.attachments;

    // Delete related attachments from s3
    if (attachments && attachments.length > 0) {
      await Promise.all(
        attachments.map(async (file: any) => {
          await deleteFileFromS3(file.key);
        })
      );
    }

    await Task.findByIdAndDelete(taskId);

    io.emit("taskDeleted", {
      _id: task._id,
      status: task.status,
    });

    new AppResponse(res, 200, "Task deleted successfully");
  } catch (error) {
    next(error);
  }
};
