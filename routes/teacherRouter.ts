import express from "express";
import {
    activateAccount,
    onboading,
    register,
    login,
    logout,
} from "../controllers/teacherAuthControllers.ts";
import { upload } from "../middlewares/upload.multer.ts";
import { authorizedRoles, isAuthenticated } from "../middlewares/auth.ts";
import {
    earnignByCourseNmonths,
    lastTwoMonthPurchaseCount,
    lastTwoMonthRevenue,
    lifetimeEarning,
    TRequest,
} from "../controllers/teacherDashboardControllers.ts";

const teacherRouter = express.Router();

teacherRouter.post("/auth/register", register);
teacherRouter.post("/auth/activate", activateAccount);
teacherRouter.post("/auth/login", login);
teacherRouter.post("/auth/logout", logout);

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

//protected rotues
teacherRouter.use(isAuthenticated, authorizedRoles("teacher"));

teacherRouter.get("/dashboard/revenue", (req, res) =>
    lastTwoMonthRevenue(req as TRequest, res)
);
teacherRouter.get("/dashboard/purchase", (req, res) =>
    lastTwoMonthPurchaseCount(req as TRequest, res)
);
teacherRouter.get("/dashboard/lifetime-earning", (req, res) =>
    lifetimeEarning(req as TRequest, res)
);
teacherRouter.get("/dashboard/earning/monthly", (req, res) =>
    earnignByCourseNmonths(req as TRequest, res)
);

export default teacherRouter;
