import express from "express";
import { approveOnboarding, onboardingTeacherList, rejectOnboarding } from "../controllers/admin.teacherMangementControllers.js";

import {
    login,
    register,
    updateAccessToken,
} from "./../controllers/adminAuthControllers.js";

const adminRouter = express.Router();


adminRouter.post("/auth/register", register);
adminRouter.post("/auth/login", login);
adminRouter.post("/auth/refresh", updateAccessToken);


adminRouter.get("/teacher/onboarding-list", onboardingTeacherList);
adminRouter.patch("/teacher/approve-onboarding", approveOnboarding);
adminRouter.patch("/teacher/reject-onboarding", rejectOnboarding);



export default adminRouter;
