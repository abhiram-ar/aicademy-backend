import { Request, Response } from "express";
import orderModel from "./../models/orderModel";
import teacherModel from "../models/teacherModel";
import { reportModel } from "../models/userCourseReportModel";
import courseModel from "../models/course.model";
import { logErrorMessage } from "../utils/log";
import { title } from "process";

export const allCourseReportList = async (req: Request, res: Response) => {
    try {
        const { search = "", limit = 10, page = 1 } = req.query;

        const skip =
            (parseInt(page as string) - 1) * (parseInt(limit as string) ?? 0);

        const result = await courseModel.aggregate([
            { $match: { title: { $regex: search, $options: "i" } } },

            // 1st major stage - to find total revenue
            {
                $lookup: {
                    from: "orders",
                    let: { courseId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $in: [
                                        "$$courseId",
                                        {
                                            $map: {
                                                input: "$coursesBought",
                                                as: "course",
                                                in: "$$course.courseId",
                                            },
                                        },
                                    ],
                                },
                            },
                        },
                        {
                            $unwind: "$coursesBought",
                        },
                        {
                            $match: {
                                $expr: {
                                    $eq: [
                                        "$coursesBought.courseId",
                                        "$$courseId",
                                    ],
                                },
                            },
                        },
                        {
                            $group: {
                                _id: null,
                                totalRevenue: {
                                    $sum: "$coursesBought.soldPrice",
                                },
                            },
                        },
                    ],
                    as: "orderStats",
                },
            },

            // 2nd major stage
            {
                $lookup: {
                    from: "teachers",
                    localField: "createdBy",
                    foreignField: "_id",
                    as: "teacher",
                },
            },

            // 3d major state - total issues reported
            {
                $lookup: {
                    from: "reports",
                    let: { courseId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$courseId", "$$courseId"] },
                            },
                        },
                        {
                            $group: { _id: null, totalReports: { $sum: 1 } },
                        },
                    ],
                    as: "reportStatus",
                },
            },

            {
                $project: {
                    courseName: "$title",
                    status: "$courseState",
                    teacherName: { $arrayElemAt: ["$teacher.legalName", 0] }, //after lookup $teacher is an array of single item, return 0th position with legalName field
                    unitsSold: { $ifNull: ["$boughtCount", 0] },
                    totalRevenue: {
                        $ifNull: [
                            { $arrayElemAt: ["$orderStats.totalRevenue", 0] },
                            0,
                        ],
                    },
                    issuesCount: {
                        $ifNull: [
                            { $arrayElemAt: ["$reportStatus.totalReports", 0] },
                            0,
                        ],
                    },
                },
            },
            {
                $sort: { status: -1, totalRevenue: -1 },
            },
            {
                $skip: skip,
            },
            {
                $limit: parseInt(limit as string) || 1,
            },
        ]);

        const totalEntries = await courseModel.countDocuments({});

        res.status(200).json({
            success: true,
            message: "successfully fetced all course report list",
            length: result.length,
            pages: Math.ceil(totalEntries / (parseInt(limit as string) || 1)),
            data: result,
        });
    } catch (error) {
        logErrorMessage("error while fetching all course report list");
        logErrorMessage(error.message);
        console.log(error);
        res.status(400).json({
            success: false,
            message: "error while fetching all cousre report list",
        });
    }
};
