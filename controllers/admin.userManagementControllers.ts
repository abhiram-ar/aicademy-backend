import { Request, Response } from "express";
import { logErrorMessage, logWarning } from "../utils/log";
import { FilterQuery } from "mongoose";
import userModel, { IUser } from "../models/userModel";

export const getUserList = async (
    req: Request,
    res: Response
): Promise<any> => {
    try {
        const { search, limit = 10, page = 1 } = req.query;

        const filter: FilterQuery<IUser> = {};

        if (search) {
            filter.$or = [
                { firstName: { $regex: search as string, $options: "i" } },
                { lastName: { $regex: search as string, $options: "i" } },
                { email: { $regex: search as string, $options: "i" } },
            ];
        }

        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

        const userList = await userModel
            .find(filter)
            .select("firstName lastName email isBlocked")
            .skip(skip)
            .limit(parseInt(limit as string));

        console.log(userList);

        const total = await userModel.countDocuments(filter);

        return res.status(200).json({
            success: false,
            message: "userlist successfully fetched",
            length: userList.length,
            userList,
            pages: Math.ceil(total / parseInt(limit as string)),
        });
    } catch (error) {
        logWarning("error while fetching users list");
        logErrorMessage(error.message);
        console.log(error);
        return res.status(400).json({
            success: false,
            message: "Error while fetching users list",
        });
    }
};

export const blockUser = async (req: Request, res: Response): Promise<any> => {
    try {
        const { userId } = req.body;
        if (!userId) {
            logWarning("userId missing to block user");
            return res.status(400).json({
                success: false,
                message: "userId missing to block user",
            });
        }

        await userModel.findByIdAndUpdate(userId, { isBlocked: true });
        return res
            .status(200)
            .json({ success: true, message: "user successfully blocked" });
    } catch (error) {
        logErrorMessage("error while blocking user");
        logErrorMessage(error.message);
        console.log(error);
        return res
            .status(400)
            .json({ success: false, message: "Error while blocking user" });
    }
};

export const unBlockUser = async (
    req: Request,
    res: Response
): Promise<any> => {
    try {
        const { userId } = req.body;
        if (!userId) {
            logWarning("userId missing to ubBlock user");
            return res.status(400).json({
                success: false,
                message: "userId missing to block user",
            });
        }

        await userModel.findByIdAndUpdate(userId, { isBlocked: false });
        return res
            .status(200)
            .json({ success: true, message: "user successfully unblocked" });
    } catch (error) {
        logErrorMessage("error while unblocking user");
        logErrorMessage(error.message);
        console.log(error);
        return res
            .status(400)
            .json({ success: false, message: "Error while unblocking user" });
    }
};
