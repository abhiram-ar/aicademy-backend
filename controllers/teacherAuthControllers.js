import teacherModel from "./../models/teacherModel.js";
import { logErrorMessage, logWarning } from "../utils/log.js";
import { createActivationToken, createAccessToken, createRefershToken } from "./../utils/jwt.js";
import sendMail from "../utils/sendMail.js";
import jwt from "jsonwebtoken";
import sessionModel from "../models/sessionModel.js";

export const register = async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;
        console.log(firstName, lastName, email, password);
        const isEmailExist = await teacherModel.findOne({ email });
        if (isEmailExist) {
            console.log(false, "teacher email alreay exist");
            return res
                .status(400)
                .json({ success: false, message: "Email alreay exists" });
        }

        const teacher = {
            firstName,
            lastName,
            email,
            password,
        };

        const { activationCode, activationToken } =
            createActivationToken(teacher);

        //data for email verification
        const data = { name: teacher.firstName, activationCode };

        try {
            await sendMail({
                email: teacher.email,
                subject: "Activate AIcademy account",
                template: "teacherActivationMail.ejs",
                data,
            });
            return res.status(201).json({
                success: true,
                message: `activation code send to your email ${teacher.email} `,
                activationToken,
            });
        } catch (error) {
            console.log("error while sending male to teacher");
            console.log(error);
            return res.status(500).json({
                success: false,
                message: "cannot send activaion code to email",
            });
        }
    } catch (error) {
        logErrorMessage("error while registering user");
        logErrorMessage(error.message);
        console.log(error);
        res.status(500).json({
            success: false,
            message: "erroe while registering user",
        });
    }
};

//teacehr activativation
export const activateAccount = async (req, res) => {
    try {
        const { activationCode: recievedActivationCode, activationToken } =
            req.body;

        const { activationCode, userCredentials: teacher } = jwt.verify(
            activationToken,
            process.env.ACTIVATION_CODE_SECRET
        );

        if (recievedActivationCode !== activationCode) {
            logWarning("activation tokens dont match");
            return res.status(400).json({
                success: false,
                message: "OTP dont match, try again",
            });
        }

        const { firstName, lastName, email, password } = teacher;

        const existTeacher = await teacherModel.findOne({ email });
        if (existTeacher) {
            logWarning(`teacher email already exist in database`);
            return res.status(400).json({
                success: false,
                message: "email already exist, please login",
            });
        }

        const newTeacher = await teacherModel.create({
            firstName,
            lastName,
            email,
            password,
            isVerified: true,
        });

        return res.status(201).json({
            success: true,
            message: "teacher activated sucessfully, now admin verification",
        });
    } catch (error) {
        logErrorMessage(error.message);
        console.log(error);
        res.status(400).json({
            success: false,
            message: "error while activating your account",
            data: {
                teacher: {
                    _id: newTeacher._id,
                    email: newTeacher.email,
                    isApproved: false,
                },
            },
        });
    }
};

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

        const teacher = await teacherModel.findOne({ email }).select("+password");
        if (!teacher) {
            logWarning("login: invalid email, didnt find teacher in DB");
            return res
                .status(400)
                .json({ success: false, message: "Invalid email or password" });
        }

        if (teacher.isBlocked) {
            logWarning("teacher is blocked, cannot login");
            return res.status(403).json({
                success: false,
                message: "teacher is blocked. Contact admin",
            });
        }

        const isPasswordMatch = await teacher.comparePassword(password);
        if (!isPasswordMatch) {
            logWarning("login: password don't match");
            return res
                .status(400)
                .json({ success: false, message: "Invaid password" });
        }

        const tokenPayload = {
            teacherId: teacher._id,
            username: teacher.firstName,
            role: teacher.role,
        };

        const accessToken = createAccessToken(tokenPayload);
        const refreshToken = createRefershToken(tokenPayload);

        //save refreshtoken in session DB
        await sessionModel.create({
            role: "teacher",
            userId: teacher._id,
            email: teacher.email,
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
            role: teacher.role,
            teacher: {
                _id: teacher._id,
                firstName: teacher.firstName,
                email: teacher.email,
                isApproved: teacher.isApproved
            },
        });
    } catch (error) {
        logErrorMessage("error while logging teacher");
        logErrorMessage(error.message);
        console.log(error);
        return res
            .status(400)
            .json({ success: false, message: "login failed" });
    }
};

export const onboading = (req, res) => {
    try {
        console.log(req.body)
        res.status(200).json({ success: true, messsage: "test" });
    } catch (error) {
        logErrorMessage("error while teacher onboarding");
        logErrorMessage(error.message);
        console.log(error);
        res.status(400).json({
            success: false,
            message: "error while on boarding",
        });
    }
};
