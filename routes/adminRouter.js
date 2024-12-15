import { login, register, updateAccessToken } from "./../controllers/adminAuthControllers.js";
import express from "express";

const adminRouter = express.Router();

adminRouter.post("/auth/register", register);
adminRouter.post("/auth/login", login);
adminRouter.post("/auth/refresh", updateAccessToken);





export default adminRouter
