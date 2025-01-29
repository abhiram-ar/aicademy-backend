import adminModel from "../models/adminModel.js";
import teacherModel from "../models/teacherModel.js";
import userModel from "../models/userModel.js";
import { createAccessToken } from "../utils/jwt.js";
import { logErrorMessage, logSuccess, logWarning } from "../utils/log.js";
import jwt from "jsonwebtoken";

//get new accessToken - refersh token
export const updateAccessToken = async (req, res) => {
    logSuccess("hit global refresh");
    const { refreshJWT } = req.cookies;
    if (!refreshJWT) {
        logWarning("updateAccesToken: cannot find refersh token in cookies");
        return res.status(401).json({ success: false, message: "No refresh token in cookies" });
    }

    jwt.verify(refreshJWT, process.env.REFRESH_TOKEN_SECRET as string, async (error, decoded) => {
        if (error) {
            logErrorMessage("error while verifying refresh token");
            logErrorMessage(error.message);
            return res.status(400).json({
                success: false,
                message: "error while verifying refresh token",
            });
        }

        switch (decoded.role) {
            case "teacher":
                handleTeachers(req, res, decoded);
                break;
            case "admin":
                handleAdmin(req, res, decoded);
                break;
            case "user":
                handleUser(req, res, decoded);
                break;
            default:
                logErrorMessage("invalid user for global refersh");
                return res.status(404).json({
                    success: false,
                    message: "invalid user for global refresh",
                });
        }
    });
};

const handleTeachers = async (req, res, decoded) => {
    logSuccess("hit teacher refresh");
    const teacher = await teacherModel.findById(decoded.teacherId);

    if (!teacher) {
        logWarning("teacher no longer exist in DB");
        logWarning("requesting client to clear cookies");
        res.clearCookie("refreshJWT", {
            httpOnly: true,
            secure: process.env.nodeEnv === "production" ? true : false,
            sameSite: "Lax",
        });
        return res.status(403).json({
            success: false,
            message: "teacher is no longer exists",
        });
    }

    if (teacher.isBlocked) {
        logWarning("teacher is blocked, cannot create new access token");
        logWarning("requesting client to clear cookies");
        res.clearCookie("refreshJWT", {
            httpOnly: true,
            secure: process.env.nodeEnv === "production" ? true : false,
            sameSite: "Lax",
        });
        return res.status(403).json({
            success: false,
            message:
                "teacher is blocked. Cannot create new access token, requested to clear cookie",
        });
    }

    const newAccessToken = createAccessToken({
        teacherId: teacher._id,
        username: teacher.firstName,
        role: teacher.role,
        isApproved: teacher.isApproved,
    });

    res.status(200).json(newAccessToken);
};

const handleUser = async (req, res, decoded) => {
    logSuccess("hit user refresh");
    const userDetails = await userModel.findById(decoded.userId);

    if (!userDetails) {
        logWarning("user does not exist anymore, cannot create new access token");
        logWarning("requesting client to clear cookies");
        res.clearCookie("refreshJWT", {
            httpOnly: true,
            secure: process.env.nodeEnv === "production" ? true : false,
            sameSite: "Lax",
        });
        return res.status(403).json({
            success: false,
            message:
                "user does not exists anymore. Cannot create new access token, requested to clear cookie",
        });
    }

    if (userDetails.isBlocked) {
        logWarning("user is blocked, cannot create new access token");
        logWarning("requesting client to clear cookies");
        res.clearCookie("refreshJWT", {
            httpOnly: true,
            secure: process.env.nodeEnv === "production" ? true : false,
            sameSite: "Lax",
        });
        return res.status(403).json({
            success: false,
            message: "User is blocked. Cannot create new access token, requested to clear cookie",
        });
    }

    const newAccessToken = createAccessToken({
        userId: userDetails._id,
        username: userDetails.firstName,
        role: userDetails.role,
    });

    res.status(200).json(newAccessToken);
};

const handleAdmin = async (req, res, decoded) => {
    logSuccess("hit admin refresh");
    const admin = await adminModel.findById(decoded.adminId);

    if (!admin) {
        throw new Error("admin does not exit in Db");
    }

    if (!admin.isActive) {
        logWarning("admin is inactive, cannot create new access token");
        logWarning("requesting client to clear cookies");
        res.clearCookie("refreshJWT", {
            httpOnly: true,
            secure: process.env.nodeEnv === "production" ? true : false,
            sameSite: "Lax",
        });
        return res.status(403).json({
            success: false,
            message: "admin is inactive. Cannot create new access token, requested to clear cookie",
        });
    }

    const newAccessToken = createAccessToken({
        adminId: admin._id,
        username: admin.firstName,
        role: admin.role,
    });

    return res.status(200).json(newAccessToken);
};
