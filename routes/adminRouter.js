import { login, register } from "./../controllers/adminAuthControllers.js";
import express from "express";

const adminRouter = express.Router();

adminRouter.post("/auth/register", register);
adminRouter.post("/auth/login", login);





export default adminRouter
