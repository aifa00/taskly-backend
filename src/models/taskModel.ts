import mongoose, { Schema, model } from "mongoose";

const taskSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    status: {
      type: String,
      default: "pending",
      enum: ["pending", "in-progress", "completed", "blocked"],
    },
    startDate: {
      type: Date,
    },
    dueDate: {
      type: Date,
    },
    attachments: [
      {
        originalName: {
          type: String,
        },
        key: {
          type: String,
        },
        type: {
          type: String,
        },
      },
    ],
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
    },
  },
  { timestamps: true }
);

const Task = model("Task", taskSchema);

export default Task;
