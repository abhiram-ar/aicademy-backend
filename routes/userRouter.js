import express from 'express'
import {registerUser, activateUser, loginUser, logout, updateAccessToken} from "./../controllers/userController.js"

const userRouter = express.Router()

userRouter.post("/auth/register", registerUser)
userRouter.post("/auth/activate", activateUser)
userRouter.post("/auth/login", loginUser)
userRouter.post("/auth/logout", logout)
userRouter.post("/auth/refresh",updateAccessToken )


export default userRouter