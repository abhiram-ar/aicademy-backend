import express from "express";
import {
    addToCart,
    applyCoupon,
    getCart,
    removeCouponFromCart,
    removeFromCart,
    URequest,
} from "../controllers/userCartControllers.js";
import { authorizedRoles, isAuthenticated } from "../middlewares/auth.js";
import {
    registerUser,
    activateUser,
    loginUser,
    logout,
    generateForgetPasswordOTP,
    resetPassword,
} from "../controllers/userController.js";
import {
    changePassword,
    getProfile,
    updateProfile,
    updateProfilePic,
} from "../controllers/userProfileControllers.js";
import { upload } from "../middlewares/upload.multer.js";
import {
    createOrder,
    verifyPaymentAndCheckout,
} from "../controllers/userCheckoutControllers.js";
import {
    fetchOrderHistory,
    fetchUserBoughtCourseList,
    reportACourse,
} from "../controllers/userCourseControllers.js";
import {
    addReviewToCourse,
    editReview,
} from "../controllers/userReviewControllers.js";

const userRouter = express.Router();

userRouter.post("/auth/register", registerUser);
userRouter.post("/auth/activate", activateUser);
userRouter.post("/auth/login", loginUser);
userRouter.post("/auth/logout", logout);
userRouter.post("/auth/forgotPassword", generateForgetPasswordOTP);
userRouter.patch("/auth/resetPassword", resetPassword);

userRouter.use(isAuthenticated, authorizedRoles("user"));
//user protected rotues

userRouter.get("/profile", (req, res) => getProfile(req as URequest, res));
userRouter.patch("/profile", (req, res) => updateProfile(req as URequest, res));
userRouter.patch("/profilePic", upload.single("newProfilePic"), (req, res) =>
    updateProfilePic(req as URequest, res)
);
userRouter.patch("/password", (req, res) =>
    changePassword(req as URequest, res)
);

// cart routes
userRouter.get("/cart", (req, res) => getCart(req as URequest, res));
userRouter.post("/cart", (req, res) => addToCart(req as URequest, res));
userRouter.delete("/cart", (req, res) => removeFromCart(req as URequest, res));
userRouter.post("/cart/apply-coupon", (req, res) =>
    applyCoupon(req as URequest, res)
);
userRouter.patch("/cart/remove-coupon", (req, res) =>
    removeCouponFromCart(req as URequest, res)
);

// checkout routes
userRouter.post("/checkout/create-order", (req, res) =>
    createOrder(req as URequest, res)
);
userRouter.post("/checkout/verify-payment", (req, res) =>
    verifyPaymentAndCheckout(req as URequest, res)
);

// bought course routes
userRouter.get("/course/list", (req, res) =>
    fetchUserBoughtCourseList(req as URequest, res)
);
userRouter.post("/course/report", (req, res) =>
    reportACourse(req as URequest, res)
);
userRouter.get("/order-history", (req, res) =>
    fetchOrderHistory(req as URequest, res)
);

userRouter.post("/course/review", (req, res) =>
    addReviewToCourse(req as URequest, res)
);
userRouter.patch("/course/review", (req, res) =>
    editReview(req as URequest, res)
);

export default userRouter;
