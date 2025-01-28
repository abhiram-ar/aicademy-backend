import { Request, Response } from "express";
import { logErrorMessage, logWarning } from "../utils/log";
import { FilterQuery } from "mongoose";
import { IReport, reportModel } from "../models/userCourseReportModel";

export const fetchCourseReports = async (req: Request, res: Response): Promise<any> => {
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
            .sort({ status: 1, createdAt: 1 })
            .skip(skip)
            .limit(parseInt(limit as string))
            .populate({ path: "courseId", select: "title" })
            .populate({ path: "createdBy", select: "firstName lastName email" });

        const totalMatch = await reportModel.countDocuments(filter);
        return res.status(200).json({
            success: true,
            message: "Reports successfully fethced",
            length: reportList.length,
            reportList,
            pages: Math.ceil(totalMatch / parseInt(limit as string)),
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

export const updateReportStatus = async (req: Request, res: Response): Promise<any> => {
    try {
        const { reportId, newStatus } = req.body;
        if (!reportId || !newStatus) {
            logWarning("Required parameter missing for updating request status");
            return res.status(400).json({ success: false, message: "Required paramter missing" });
        }
        if (!(newStatus === "pending" || newStatus === "resolved")) {
            logWarning("invalid value for new status");
            return res.status(400).json({
                success: false,
                message: "Invalid value for newStatus",
            });
        }

        await reportModel.findByIdAndUpdate(reportId, { status: newStatus });
        return res.status(201).json({
            success: true,
            message: "report status updated successfully",
        });
    } catch (error) {
        logErrorMessage("error while updating report status");
        logErrorMessage(error.message);
        return res.status(400).json({
            success: false,
            message: "error while updating report status",
        });
    }
};
