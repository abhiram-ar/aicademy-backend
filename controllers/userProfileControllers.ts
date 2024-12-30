import { Response } from "express";
import { logErrorMessage, logSuccess, logWarning } from "../utils/log";
import { URequest } from "./userCartControllers";
import userModel from "../models/userModel";
import cloudinary from "../config/cloudinary";

export const getProfile = async (
    req: URequest,
    res: Response
): Promise<any> => {
    console.log(`hit`);
    try {
        const userId = req.user.userId;
        const userDetails = await userModel
            .findById(userId)
            .select("firstName lastName avatarURL profilePicture");
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

export const updateProfilePic = async (
    req: URequest,
    res: Response
): Promise<any> => {
    try {
        const userId = req.user.userId;
        const { profilePicPublic_id } = req.body;
        const file = req.file;

        if (profilePicPublic_id) {
            const deleteResult = await cloudinary.uploader.destroy(
                profilePicPublic_id
            );
            logSuccess("old profile pic deleted");
        }

        const uploadResult = await cloudinary.uploader.upload(file.path, {
            asset_folder: "profilePics/",
        });
        console.log(uploadResult);

        await userModel.findOneAndUpdate(
            { _id: userId },
            {
                $set: {
                    profilePicture: {
                        public_id: uploadResult.public_id,
                        url: uploadResult.url,
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
