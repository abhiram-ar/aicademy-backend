import express from "express";
import {
    activateAccount,
    register,
} from "./../controllers/teacherAuthControllers.js";

const teacherRouter = express.Router();

teacherRouter.post("/auth/register", register);
teacherRouter.post("/auth/activate", activateAccount);

export default teacherRouter;
