import { Router } from "express";
import {
  addNewTask,
  deleteTask,
  editTask,
  getEditTask,
  getTasks,
} from "../controllers/taskController";
import { authorizeUser, isLoggedIn } from "../middlewares/authMiddleware";
import { loginUser, registerUser } from "../controllers/authController";
import { processImages, upload } from "../middlewares/imageUploadMiddleware";

const router = Router();

router.get("/auth/user", isLoggedIn);
router.post("/register", registerUser);
router.post("/login", loginUser);
router
  .route("/tasks")
  .get(authorizeUser, getTasks)
  .post(authorizeUser, upload.array("files"), processImages, addNewTask);
router
  .route("/tasks/:taskId")
  .get(authorizeUser, getEditTask)
  .put(authorizeUser, editTask)
  .delete(authorizeUser, deleteTask);

export default router;
