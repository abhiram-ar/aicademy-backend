import express from "express";
import {
    approveOnboarding,
    onboardingTeacherList,
    rejectOnboarding,
} from "../controllers/admin.teacherMangementControllers.js";

import {
    login,
    logout,
    register,
    updateAccessToken,
} from "./../controllers/adminAuthControllers.js";
import { authorizedRoles, isAuthenticated } from "../middlewares/auth.js";

const adminRouter = express.Router();

//public rotues
adminRouter.post("/auth/register", register);
adminRouter.post("/auth/login", login);
adminRouter.post("/auth/refresh", updateAccessToken);
adminRouter.post("/auth/logout", logout);


//protected routes
adminRouter.use(isAuthenticated, authorizedRoles("admin"));
adminRouter.get("/teacher/onboarding-list", onboardingTeacherList);
adminRouter.patch("/teacher/approve-onboarding", approveOnboarding);
adminRouter.patch("/teacher/reject-onboarding", rejectOnboarding);

export default adminRouter;
