import { log, logErrorMessage, logSuccess, logWarning } from "../utils/log.js";
import { client } from "../services/googleAuth.js";
import userModel from "../models/userModel.js";
import { createAccessToken, createRefershToken } from "../utils/jwt.js";
import sessionModel from "../models/sessionModel.js";
import teacherModel from "../models/teacherModel.js";

export const googleAuth = async (req, res) => {
    try {
        const { credentials, role } = req.body;
        if (!credentials) {
            res.status(404).json({
                success: false,
                message: "credentials not found",
            });
        }
        const ticket = await client.verifyIdToken({
            idToken: credentials,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();

        if (role === "user") {
            handleUser(req, res, payload);
        } else if (role === "teacher") {
            handleTeacher(req, res, payload);
        } else {
            logWarning("Invalid role for google auth");
            return res
                .status(400)
                .json({ success: false, message: "Invalid role" });
        }
    } catch (error) {
        logErrorMessage("error while google auth");
        logErrorMessage(error.message);
        console.log(error);
        return res
            .status(400)
            .json({ success: false, message: "error while google signup" });
    }
};

const handleUser = async (req, res, payload) => {
    try {
        let user = await userModel.findOne({ email: payload.email });

        if (!user) {
            logWarning(
                "Google auth: user does not exist, trying to crate new user"
            );
            user = await userModel.create({
                email: payload.email,
                firstName: payload.name,
                avatarURL: payload.picture,
            });
            logSuccess("Google auth: new user created sucessfully");
        }

        if (user.isBlocked) {
            logWarning("user is blocked, cannot login");
            return res.status(403).json({
                success: false,
                message: "User is blocked. Contact admin",
            });
        }

        const tokenPayload = {
            userId: user._id,
            username: user.firstName,
            role: user.role,
        };

        const accessToken = createAccessToken(tokenPayload);
        const refreshToken = createRefershToken(tokenPayload);

        //save refreshtoken in session DB
        await sessionModel.create({
            role: "user",
            userId: user._id,
            email: user.email,
            refreshToken: refreshToken,
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
            user: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
            },
        });
    } catch (error) {
        logErrorMessage(`error while user google auth`);
        logErrorMessage(error.message);
        console.log(error);
        return res
            .status(400)
            .json({ success: false, message: "Error while user google auth" });
    }
};

const handleTeacher = async (req, res, payload) => {
    try {
        let teacher = await teacherModel.findOne({ email: payload.email });
        if (!teacher) {
            logWarning(
                "Google auth: teacher does not exist, trying to create new teacher"
            );
            teacher = await teacherModel.create({
                email: payload.email,
                firstName: payload.name,
                avatarURL: payload.picture,
            });
            logSuccess("Google auth: new user created sucessfully");
        }

        if (teacher.isBlocked) {
            logWarning("teacher is blocked, cannot login");
            return res.status(403).json({
                success: false,
                message: "teacher is blocked. Contact admin",
            });
        }

        const tokenPayload = {
            teacherId: teacher._id,
            username: teacher.firstName,
            role: teacher.role,
        };

        const accessToken = createAccessToken({
            ...tokenPayload,
            isApproved: teacher.isApproved,
        });
        const refreshToken = createRefershToken(tokenPayload);

        //save refreshtoken in session DB
        await sessionModel.create({
            role: teacher.role,
            userId: teacher._id,
            email: teacher.email,
            refreshToken: refreshToken,
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
            user: {
                _id: teacher._id,
                firstName: teacher.firstName,
                email: teacher.email,
                isApproved: teacher.isApproved,
            },
        });
    } catch (error) {
        logErrorMessage(`error while teacher google auth`);
        logErrorMessage(error.message);
        console.log(error);
        return res
            .status(400)
            .json({
                success: false,
                message: "Error while teacher google auth",
            });
    }
};
