import adminModel from "../models/adminModel.js";
import { logErrorMessage, logWarning } from "../utils/log.js";
import { createAccessToken, createRefershToken } from "../utils/jwt.js";
import sessionModel from "../models/sessionModel.js";

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
