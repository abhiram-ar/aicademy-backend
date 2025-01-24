import { Response } from "express";
import { logErrorMessage, logSuccess, logWarning } from "../utils/log";
import { URequest } from "./userCartControllers";
import userModel from "../models/userModel";
import bcrypt from "bcrypt";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import path from "path";
import fs from "fs";
import s3 from "../services/aws.S3Client";
export const getProfile = async (req: URequest, res: Response): Promise<any> => {
    try {
        const userId = req.user.userId;
        const userDetails = await userModel
            .findById(userId)
            .select("firstName lastName avatarURL profilePicture googleAuth");
        return res.status(200).json({
            success: true,
            message: "userdetails successfully fetched",
            userDetails,
            createdAt: Date.now(),
        });
    } catch (error) {
        logErrorMessage("error while fetching user profile");
        logErrorMessage(error.message);
        return res.status(400).json({
            success: false,
            message: "Error while fetching user profile",
        });
    }
};

export const updateProfile = async (req: URequest, res: Response): Promise<any> => {
    try {
        const { firstName, lastName } = req.body;
        await userModel.findByIdAndUpdate(req.user.userId, {
            firstName,
            lastName,
        });
        return res.status(200).json({
            success: false,
            message: "user profile successfully updated",
        });
    } catch (error) {
        logErrorMessage("error while updating user profile");
        logErrorMessage(error.message);
        console.log(error);
        return res.status(400).json({
            success: false,
            message: "error while updating user profile",
        });
    }
};

export const updateProfilePic = async (req: URequest, res: Response): Promise<any> => {
    try {
        const userId = req.user.userId;
        const { profilePicS3Key } = req.body;
        const file = req.file;

        const fileStream = fs.createReadStream(path.join(__dirname, "..", file.path));
        const newS3Key = path.join("user", "profilePics", file.filename);
        const uploadCommand = new PutObjectCommand({
            Key: newS3Key,
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            ContentType: file.mimetype,
            Body: fileStream,
        });
        await s3.send(uploadCommand);
        logSuccess("uploaded new profilePic");

        if (profilePicS3Key) {
            const deleteCommand = new DeleteObjectCommand({
                Key: profilePicS3Key,
                Bucket: process.env.AWS_S3_BUCKET_NAME,
            });
            await s3.send(deleteCommand);
            logWarning("old profile pic deleted from s3");
        }

        await userModel.findOneAndUpdate(
            { _id: userId },
            {
                $set: {
                    profilePicture: {
                        s3Key: newS3Key,
                        url: `${process.env.AWS_CLOUDFRONT_DISTRIBUTION_BASE_URL}/${newS3Key}`,
                    },
                },
            },
            { runValidators: true }
        );
        logSuccess(`new profilepic details updatedDB`);

        res.status(200).json({
            success: true,
            message: "profilepic updated successfully",
        });
    } catch (error) {
        logErrorMessage(`error while uploading profilePic`);
        logErrorMessage(error.message);
        console.log(error);
        return res.status(400).json({
            success: false,
            message: "error while uploading profilepic",
        });
    }
};

export const changePassword = async (req: URequest, res: Response): Promise<any> => {
    try {
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) {
            logWarning("oldPassword or newPassword is missing while changing password");
            return res.status(400).json({
                success: false,
                message: "oldPassword or newPassword missing",
            });
        }

        const userDetails = await userModel.findById(req.user.userId).select("+password");

        if (!userDetails) {
            logWarning("change password: user email does not exist in DB");
            return res.status(404).json({ success: false, message: "Invalid credentials " });
        }

        const isPasswordMatch = await userDetails.comparePassword(oldPassword);
        if (!isPasswordMatch) {
            logWarning("password does not match");
            return res.status(400).json({ success: false, message: "Wrong old password" });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        await userDetails.updateOne({
            password: hashedNewPassword,
            googleAuth: false,
        });

        res.status(200).json({
            success: true,
            message: "password successfully changed",
        });
    } catch (error) {
        logErrorMessage("error while changing password");
        logErrorMessage(error.message);
        console.log(error);
        return res.status(400).json({ success: false, message: "error while changing password" });
    }
};
