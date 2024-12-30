import express from "express";
import {
    addToCart,
    getCart,
    removeFromCart,
    URequest,
} from "../controllers/userCartControllers.js";
import { authorizedRoles, isAuthenticated } from "../middlewares/auth.js";
import {
    registerUser,
    activateUser,
    loginUser,
    logout,
} from "../controllers/userController.js";
import { getProfile, updateProfilePic } from "../controllers/userProfileControllers.js";
import { upload } from "../middlewares/upload.multer.js";

const userRouter = express.Router();

userRouter.post("/auth/register", registerUser);
userRouter.post("/auth/activate", activateUser);
userRouter.post("/auth/login", loginUser);
userRouter.post("/auth/logout", logout);

userRouter.use(isAuthenticated, authorizedRoles("user"));
//user protected rotues

userRouter.get("/profile", (req, res) => getProfile(req as URequest, res));
userRouter.patch("/profilePic", upload.single("newProfilePic") ,(req, res) => updateProfilePic(req as URequest, res));


userRouter.get("/cart", (req, res) => getCart(req as URequest, res));
userRouter.post("/cart", (req, res) => addToCart(req as URequest, res));
userRouter.delete("/cart", (req, res) => removeFromCart(req as URequest, res));

export default userRouter;
