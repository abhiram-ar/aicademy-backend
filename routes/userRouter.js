import express from 'express'
import {registerUser, activateUser} from "./../controllers/userController.js"

const userRouter = express.Router()

userRouter.post("/auth/register", registerUser)
userRouter.post("/auth/activate", activateUser)

export default userRouter