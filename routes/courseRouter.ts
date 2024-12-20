import Express from "express";
import { createCourse } from "../controllers/teacher.courseManagementControllers";

const courseRouter = Express.Router()
    

courseRouter.post("/create", createCourse)

export default courseRouter