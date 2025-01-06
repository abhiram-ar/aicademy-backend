import { Request, Response } from "express";
import { logErrorMessage, logWarning } from "../utils/log";
import { FilterQuery } from "mongoose";
import { IReport, reportModel } from "../models/userCourseReportModel";

export const fetchCourseReports = async (
    req: Request,
    res: Response
): Promise<any> => {
    try {
        const { search, limit = 10, page = 1 } = req.query;

        const filter: FilterQuery<IReport> = {};
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
            ];
        }

        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

        const reportList = await reportModel
            .find(filter)
            .skip(skip)
            .limit(parseInt(limit as string));

        const totalPages = await reportModel.countDocuments(filter);
        return res
            .status(200)
            .json({
                success: true,
                message: "Reports successfully fethced",
                reportList,
                pages: totalPages,
            });
    } catch (error) {
        logErrorMessage("error while fetching course reports");
        logErrorMessage(error.message);
        console.log(error);
        res.status(400).json({
            success: false,
            message: "error while fetching user reports",
        });
    }
};
