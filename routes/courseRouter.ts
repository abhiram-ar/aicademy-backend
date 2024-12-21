import Express from "express";
import { createCourse, editCourse, generatePresignedURL } from "../controllers/teacher.courseManagementControllers";

const courseRouter = Express.Router()


courseRouter.post("/create", createCourse)
courseRouter.patch("/edit", editCourse)

courseRouter.post("/upload/presignedurl", generatePresignedURL)

export default courseRouter