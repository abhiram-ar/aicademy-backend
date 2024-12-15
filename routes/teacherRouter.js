import express from "express";
import {
    activateAccount,
    onboading,
    register,
    login,
    updateAccessToken,
    logout
} from "./../controllers/teacherAuthControllers.js";
import { upload } from "../middlewares/upload.multer.js";
import { isAuthenticated } from "../middlewares/auth.js";

const teacherRouter = express.Router();

teacherRouter.post("/auth/register", register);
teacherRouter.post("/auth/activate", activateAccount);
teacherRouter.post("/auth/login", login);
teacherRouter.post("/auth/refresh", updateAccessToken)
teacherRouter.post("/auth/logout", logout)

teacherRouter.post(
    "/onboard",
    isAuthenticated,
    upload.fields([
        { name: "profilePic", maxCount: 1 },
        { name: "legalNameProof", maxCount: 1 },
        { name: "qualificationProof", maxCount: 1 },
    ]),
    onboading
);

export default teacherRouter;
