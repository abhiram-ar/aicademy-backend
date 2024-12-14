import express from "express";
import {
    activateAccount,
    onboading,
    register,
} from "./../controllers/teacherAuthControllers.js";

const teacherRouter = express.Router();

teacherRouter.post("/auth/register", register);
teacherRouter.post("/auth/activate", activateAccount);
teacherRouter.post("/onboard", onboading)

export default teacherRouter;
