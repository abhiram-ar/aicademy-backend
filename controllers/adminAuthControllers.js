import adminModel from "../models/adminModel.js";
import { logErrorMessage, logWarning } from "../utils/log.js";
import { createAccessToken, createRefershToken } from "../utils/jwt.js";
import sessionModel from "../models/sessionModel.js";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;

        const isEmailExist = await adminModel.findOne({ email });
        if (isEmailExist) {
            console.log(false, "admin email alreay exist");
            return res
                .status(400)
                .json({ success: false, message: "Email already exists" });
        }

        await adminModel.create({
            firstName,
            lastName,
            email,
            password,
        });

        return res.status(201).json({
            success: true,
            message: "admin account created",
        });
    } catch (error) {
        logErrorMessage("error while registering user");
        logErrorMessage(error.message);
        console.log(error);
        res.status(500).json({
            success: false,
            message: "error while registering user",
            errorMessage: error.message,
        });
    }
};

// admin login
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            logWarning("login: no email or password");
            return res.status(400).json({
                success: false,
                message: "Please enter email and password",
            });
        }

        const admin = await adminModel.findOne({ email }).select("+password");
        if (!admin) {
            logWarning("login: invalid email, didnt find admin in DB");
            return res
                .status(400)
                .json({ success: false, message: "Invalid email or password" });
        }

        if (!admin.isActive) {
            logWarning("teacher is not active, cannot login");
            return res.status(403).json({
                success: false,
                message: "admin is not active, cannot login",
            });
        }

        const isPasswordMatch = await admin.comparePassword(password);
        if (!isPasswordMatch) {
            logWarning("login: password don't match");
            return res
                .status(400)
                .json({ success: false, message: "Invaid password" });
        }

        const tokenPayload = {
            adminId: admin._id,
            username: admin.firstName,
            role: admin.role,
        };

        const accessToken = createAccessToken(tokenPayload);
        const refreshToken = createRefershToken(tokenPayload);

        // save refreshtoken in session DB
        // userID: is reused for allusers
        await sessionModel.create({
            role: admin.role,
            userId: admin._id,
            email: admin.email,
            refreshToken,
        });
        res.cookie("refreshJWT", refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: "Lax",
            maxAge: 60 * 60 * 1000, //1hr
        });

        return res.status(200).json({
            success: true,
            message: "login successful",
            token: accessToken,
            role: admin.role,
            admin: {
                _id: admin._id,
                firstName: admin.firstName,
                email: admin.email,
            },
        });
    } catch (error) {
        logErrorMessage("error while logging admin");
        logErrorMessage(error.message);
        console.log(error);
        return res
            .status(400)
            .json({ success: false, message: "login failed" });
    }
};

//get new accessToken - refersh token
export const updateAccessToken = async (req, res) => {
    const { refreshJWT } = req.cookies;
    if (!refreshJWT) {
        logWarning("updateAccesToken: cannot find refersh token in cookies");
        return res
            .status(401)
            .json({ success: false, message: "No refresh token in cookies" });
    }

    jwt.verify(
        refreshJWT,
        process.env.REFRESH_TOKEN_SECRET,
        async (error, decoded) => {
            if (error) {
                logErrorMessage("error while verifying refresh token");
                logErrorMessage(error.message);
                return res.status(400).json({
                    success: false,
                    message: "error while verifying refresh token",
                });
            }

            const sessionDetails = await sessionModel.findOne({
                refreshToken: refreshJWT,
            });

            if (!sessionDetails) {
                logWarning(
                    "refresh token does not exist in DB, requesting client to clear cookies"
                );
                res.clearCookie("refreshJWT", {
                    httpOnly: true,
                    secure: false,
                    sameSite: "Lax",
                });
                return res.status(403).json({
                    success: false,
                    message: "admin session does't exist anymore",
                });
            }

            const admin = await adminModel.findById(decoded.adminId);
            if (!admin.isActive) {
                logWarning("admin is inactive, cannot create new access token");
                logWarning("requesting client to clear cookies");
                res.clearCookie("refreshJWT", {
                    httpOnly: true,
                    secure: false,
                    sameSite: "Lax",
                });
                return res.status(403).json({
                    success: false,
                    message:
                        "admin is inactive. Cannot create new access token, requested to clear cookie",
                });
            }

            const newAccessToken = createAccessToken({
                adminId: admin._id,
                username: admin.firstName,
                role: admin.role,
            });

            return res.status(200).json(newAccessToken);
        }
    );
};

//logout admin
export const logout = async (req, res) => {
    try {
        const { refreshJWT } = req.cookies;
        if (!refreshJWT) {
            logWarning("logout: cannot find refresh token in cookies");
            return res.status(204).send();
        }

        let result = await sessionModel.deleteOne({ refreshToken: refreshJWT });

        res.clearCookie("refreshJWT", {
            httpOnly: true,
            secure: false,
            sameSite: "Lax",
        });

        if (result.deletedCount === 0) {
            logWarning("logout: No session to delete");
            return res.status(200).json({
                success: true,
                message:
                    "cannot find session to logout, client is requested to clear the cookie",
            });
        }
        res.status(200).json({
            success: true,
            message: "admin logged out successfully",
        });
    } catch (error) {
        logErrorMessage("error while logging out admin");
        logErrorMessage(error.message);
        console.log(error);
        res.status(400).json({
            success: false,
            messsage: "error while logging out admin",
        });
    }
};


