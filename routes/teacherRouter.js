import express from "express";
import {
    activateAccount,
    onboading,
    register,
    login
} from "./../controllers/teacherAuthControllers.js";

const teacherRouter = express.Router();

teacherRouter.post("/auth/register", register);
teacherRouter.post("/auth/activate", activateAccount);
teacherRouter.post("/auth/login", login);

teacherRouter.post("/onboard", onboading)

export default teacherRouter;
