import Express from "express";
import { createCourse, editCourse } from "../controllers/teacher.courseManagementControllers";

const courseRouter = Express.Router()


courseRouter.post("/create", createCourse)
courseRouter.patch("/edit", editCourse)

export default courseRouter