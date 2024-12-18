import teacherModel from "./../models/teacherModel.js";
import { logErrorMessage, logWarning } from "../utils/log.js";
import {
    createActivationToken,
    createAccessToken,
    createRefershToken,
} from "./../utils/jwt.js";
import sendMail from "../utils/sendMail.js";
import jwt from "jsonwebtoken";
import sessionModel from "../models/sessionModel.js";
import cloudinary from "./../config/cloudinary.js";

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

        const teacher = await teacherModel
            .findOne({ email })
            .select("+password");
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

        if (teacher.googleAuth) {
            logWarning("gAuth teacher is using email-password to login");
            logWarning("requesting client to use gAuth to login instead");
            return res.status(400).json({
                success: false,
                message: "GAuth account: Please use sign-in with Google",
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

        const accessToken = createAccessToken({
            ...tokenPayload,
            isApproved: teacher.isApproved,
        });
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
                isApproved: teacher.isApproved,
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

// teacher onboarding - admin approval request
export const onboading = async (req, res) => {
    try {
        const teacher = await teacherModel.findById(req.user.teacherId);
        if (!teacher) {
            return res
                .status(404)
                .json({ success: false, message: "Invalid teacher" });
        }

        if (teacher.isApproved === "success") {
            return res.status(400).json({
                success: false,
                message: "user already approved/onboarded",
            });
        }

        console.log(req.body);
        const uploadProfilePic = cloudinary.uploader.upload(
            req.files.profilePic[0].path,
            { asset_folder: `onboading-details/${req.user?.teacherId || ""}` }
        );
        const uploadLegalNameProof = cloudinary.uploader.upload(
            req.files.legalNameProof[0].path,
            { asset_folder: `onboading-details/${req.user?.teacherId || ""}` }
        );
        const uploadQualificationProof = cloudinary.uploader.upload(
            req.files.qualificationProof[0].path,
            { asset_folder: `onboading-details/${req.user?.teacherId || ""}` }
        );

        const uploadFiles = await Promise.all([
            uploadProfilePic,
            uploadLegalNameProof,
            uploadQualificationProof,
        ]);

        teacher.profilePic = {
            url: uploadFiles[0].url,
            public_id: uploadFiles[0].public_id,
        };

        teacher.legalName = req.body.legalName;
        teacher.legalNameProof = {
            url: uploadFiles[1].url,
            public_id: uploadFiles[1].public_id,
        };

        teacher.country = req.body.country;
        teacher.phoneNo = req.body.phoneNo;

        teacher.biography = req.body.biography;
        teacher.education = req.body.education;
        teacher.college = req.body.college;
        teacher.qualification = req.body.qualification;
        teacher.qualificationProof = {
            url: uploadFiles[2].url,
            public_id: uploadFiles[2].public_id,
        };
        teacher.remark = req.body.remark;
        teacher.isApproved = "pending";

        logWarning("new teacher");
        console.log(teacher);

        await teacher.save();
        return res.status(201).json({
            success: true,
            message:
                "Onboading details send for verification.This can take a while.Please check your mail regularly for updates",
        });
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
                    message: "teacher session does't exist anymore",
                });
            }

            const teacher = await teacherModel.findById(decoded.teacherId);
            if (teacher.isBlocked) {
                logWarning(
                    "teacher is blocked, cannot create new access token"
                );
                logWarning("requesting client to clear cookies");
                res.clearCookie("refreshJWT", {
                    httpOnly: true,
                    secure: false,
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
                username: teacherModel.firstName,
                role: teacher.role,
                isApproved: teacher.isApproved,
            });

            res.status(200).json(newAccessToken);
        }
    );
};

//logout teacher
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
            message: "teacher logged out successfully",
        });
    } catch (error) {
        logErrorMessage("error while logging out teacher");
        logErrorMessage(error.message);
        console.log(error);
        res.status(400).json({
            success: false,
            messsage: "error while logging out teacher",
        });
    }
};
