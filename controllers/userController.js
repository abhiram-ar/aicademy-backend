import userModel from "./../models/userModel.js";
import jwt from "jsonwebtoken";
import path from "path";
import { __dirname, __filename } from "./../config/esModuleScope.js";
import sendMail from "./../utils/sendMail.js";
import ejs from "ejs";
import { log, logErrorMessage, logWarning, logSuccess } from "../utils/log.js";
import chalk from "chalk";
import { createAccessToken, createRefershToken } from "./../utils/jwt.js";
import sessionModel from "./../models/sessionModel.js";
//user registeration
export const registerUser = async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;
        console.log(firstName, lastName, email, password);
        const isEmailExist = await userModel.findOne({ email });
        if (isEmailExist) {
            console.log(false, "user email alreay exist");
            return res
                .status(400)
                .json({ success: false, message: "Email alreay exists" });
        }

        const user = {
            firstName,
            lastName,
            email,
            password,
        };

        const { activationCode, activationToken } = createActivationToken(user);

        //send activation code to usersEmail
        const data = { name: user.firstName, activationCode };
        const html = ejs.renderFile(
            path.join(__dirname, "../mails/userActivationMail.ejs"),
            data
        );

        try {
            await sendMail({
                email: user.email,
                subject: "Activate AIcademy account",
                template: "userActivationMail.ejs",
                data,
            });
            return res.status(201).json({
                success: true,
                message: `activation code send to your email ${user.email} `,
                activationToken,
            });
        } catch (error) {
            console.log("error while sending male to user");
            console.log(error);
            return res.status(500).json({
                success: false,
                message: "cannot send activaion code to email",
            });
        }
    } catch (error) {
        console.log(error);
        return res
            .status(400)
            .json({ success: false, message: "error while registering user" });
    }
};

export const createActivationToken = (user) => {
    const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
    const tokenPayload = { user, activationCode };
    const activationToken = jwt.sign(
        tokenPayload,
        process.env.ACTIVATION_CODE_SECRET,
        {
            expiresIn: "5m",
        }
    );

    return { activationToken, activationCode };
};

//user activativation
export const activateUser = async (req, res) => {
    try {
        const { activationCode: recievedActivationCode, activationToken } =
            req.body;

        const { activationCode, user } = jwt.verify(
            activationToken,
            process.env.ACTIVATION_CODE_SECRET
        );

        if (recievedActivationCode !== activationCode) {
            console.assert(false, "activation tokens dont match");
            return res.status(400).json({
                success: false,
                message: "OTP dont match, try again",
            });
        }

        const { firstName, lastName, email, password } = user;

        const existUser = await userModel.findOne({ email });
        if (existUser) {
            console.assert(false, `user email already exist in database`);
            return res.status(400).json({
                success: false,
                message: "email already exist, please login",
            });
        }

        const newUser = await userModel.create({
            firstName,
            lastName,
            email,
            password,
            isVerified: true,
        });

        return res
            .status(201)
            .json({ success: true, message: "user activated sucessfully" });
    } catch (error) {
        log(chalk.yellow(error.message));
        console.log(error);
        res.status(400).json({
            success: false,
            message: "error while activating your account",
        });
    }
};

//login user
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            logWarning("login: no email or password");
            return res.status(400).json({
                success: false,
                message: "Please enter email and password",
            });
        }

        const user = await userModel.findOne({ email }).select("+password");
        if (!user) {
            logWarning("login: invalid email, didnt find user in DB");
            return res
                .status(400)
                .json({ success: false, message: "Invalid email or password" });
        }

        const isPasswordMatch = await user.comparePassword(password);
        if (!isPasswordMatch) {
            logWarning("login: password don't match");
            return res
                .status(400)
                .json({ success: false, message: "Invaid password" });
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
            userId: user._id,
            email: user.email,
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
        });
    } catch (error) {
        logErrorMessage("error while logging user");
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
                    message: "User session does't exist anymore",
                });
            }

            const userDetails = await userModel.findById(decoded.userId);
            if (userDetails.isBlocked) {
                logWarning("user is blocked, cannot create new access token");
                logWarning("requesting client to clear cookies");
                res.clearCookie("refreshJWT", {
                    httpOnly: true,
                    secure: false,
                    sameSite: "Lax",
                });
                return res.status(403).json({
                    success: false,
                    message:
                        "User is blocked. Cannot create new access token, requested to clear cookie",
                });
            }

            const newAccessToken = createAccessToken({
                userId: userDetails._id,
                username: userDetails.firstName,
                role: "user",
            });

            res.status(200).json(newAccessToken);
        }
    );
};

//logout user
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
            message: "user logged out successfully",
        });
    } catch (error) {
        logErrorMessage("error while logging out user");
        logErrorMessage(error.message);
        console.log(error);
        res.status(400).json({
            success: false,
            messsage: "error while logging out user",
        });
    }
};
