import express from "express"
import {register} from "./../controllers/teacherAuthControllers.js"

const teacherRouter = express.Router()

teacherRouter.post("/auth/register", register)

export default teacherRouter
