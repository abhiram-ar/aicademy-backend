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
import {
    changeCouponStatus,
    createCoupon,
    fetchCoupons,
} from "../controllers/adminCouponControllers.ts";
import {
    fetchCourseReports,
    updateReportStatus,
} from "../controllers/adminCourseReportControllers.ts";
import {
    calculateRevenueAndProfit,
    overviewReportLastTwoMonth,
    reveueList,
} from "../controllers/adminDashboarControllers.ts";
import {
    getPayoutList,
    updatePayoutApprovalStatus,
} from "../controllers/adminTeachePayoutControllers.ts";
import {
    allCourseReportList,
    takeDownCourse,
} from "../controllers/adminCourseManagementControllers.ts";

const adminRouter = express.Router();

//public rotues
adminRouter.post("/auth/register", register);
adminRouter.post("/auth/login", login);
adminRouter.post("/auth/logout", logout);

adminRouter.use(isAuthenticated, authorizedRoles("admin"));
//protected routes

// teacher onboarding routes
adminRouter.get("/teacher/onboarding-list", onboardingTeacherList);
adminRouter.patch("/teacher/approve-onboarding", approveOnboarding);
adminRouter.patch("/teacher/reject-onboarding", rejectOnboarding);

// payout controllers
adminRouter.get("/teacher/payout-list", getPayoutList);
adminRouter.patch("/teacher/payout/approval", updatePayoutApprovalStatus);

// user management routes
adminRouter.get("/user/list", getUserList);
adminRouter.patch("/user/block", blockUser);
adminRouter.patch("/user/unblock", unBlockUser);

// user course-reports routes
adminRouter.get("/user/course/reports", fetchCourseReports);
adminRouter.patch("/user/course/report/status", updateReportStatus);

// coupon management routes
adminRouter.get("/course/coupon", fetchCoupons);
adminRouter.post("/course/coupon", createCoupon);
adminRouter.patch("/course/coupon/state", changeCouponStatus);

// course management routes
adminRouter.get("/course", allCourseReportList);
adminRouter.patch("/course/takedown", takeDownCourse);

// overview controllers
adminRouter.get("/dashboard/overview", overviewReportLastTwoMonth);
adminRouter.get("/dashboard/revenue-profit", calculateRevenueAndProfit);
adminRouter.get("/revenue-list", reveueList);

export default adminRouter;
