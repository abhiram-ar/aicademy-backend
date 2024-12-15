import { register } from "./../controllers/adminAuthControllers.js";
import express from "express";

const adminRouter = express.Router();

adminRouter.post("/auth/register", register);




export default adminRouter
