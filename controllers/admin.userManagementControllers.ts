import { Request, Response } from "express";
import { logErrorMessage, logWarning } from "../utils/log";
import { FilterQuery } from "mongoose";
import userModel, { IUser } from "../models/userModel";

const getUserList = async (req: Request, res: Response): Promise<any> => {
    try {
        const { search, limit = 10, page = 1 } = req.query;

        const filter: FilterQuery<IUser> = {};

        if (search) {
            filter.firstName = { $regex: search as string, $options: "i" };
            filter.lastName = { $regex: search as string, $options: "i" };
            filter.email = { $regex: search as string, $options: "i" };
        }

        const skip = parseInt(page as string) - 1 * parseInt(limit as string);

        const userList = await userModel
            .find(filter)
            .skip(skip)
            .limit(parseInt(limit as string));

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
