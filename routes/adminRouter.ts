import express from "express";
import {
    approveOnboarding,
    onboardingTeacherList,
    rejectOnboarding,
} from "../controllers/admin.teacherMangementControllers.ts";

import {
    login,
    logout,
    register,
} from "../controllers/adminAuthControllers.ts";
import { authorizedRoles, isAuthenticated } from "../middlewares/auth.ts";
import {
    blockUser,
    getUserList,
    unBlockUser,
} from "../controllers/admin.userManagementControllers.ts";

const adminRouter = express.Router();

//public rotues
adminRouter.post("/auth/register", register);
adminRouter.post("/auth/login", login);
adminRouter.post("/auth/logout", logout);

adminRouter.use(isAuthenticated, authorizedRoles("admin"));
//protected routes
adminRouter.get("/teacher/onboarding-list", onboardingTeacherList);
adminRouter.patch("/teacher/approve-onboarding", approveOnboarding);
adminRouter.patch("/teacher/reject-onboarding", rejectOnboarding);

adminRouter.get("/user/list", getUserList);
adminRouter.patch("/user/block", blockUser);
adminRouter.patch("/user/unblock", unBlockUser);

export default adminRouter;
