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
    fetchTeacherSalesList,
    lastTwoMonthPurchaseCount,
    lastTwoMonthRevenue,
    lifetimeEarning,
    TRequest,
} from "../controllers/teacherDashboardControllers.ts";
import {
    createBankVerificationOrder,
    getBankVerificationStatus,
    teacherPayoutHistoryList,
    verifyPaymentAndTecherBankAccount,
    withdraw,
    withdrawableAmountAndTotalCashedout,
} from "../controllers/teacherPayoutControllers.ts";

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

// dashboard
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
teacherRouter.get("/dashboard/sales-list", (req, res) =>
    fetchTeacherSalesList(req as TRequest, res)
);

// payouts
teacherRouter.get("/withdrawable-amount", withdrawableAmountAndTotalCashedout);
teacherRouter.post(
    "/payout/verification/create-order",
    createBankVerificationOrder
);
teacherRouter.post(
    "/payout/verification/verify",
    verifyPaymentAndTecherBankAccount
);
teacherRouter.get("/payout/verification/isVerified", getBankVerificationStatus);
teacherRouter.get("/payout/history", teacherPayoutHistoryList);

teacherRouter.post("/payout/withdraw", (req, res) =>
    withdraw(req as TRequest, res)
);

export default teacherRouter;
