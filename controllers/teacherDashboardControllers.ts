import { Request, Response } from "express";
import { logErrorMessage, logWarning } from "../utils/log";
import orderModel from "./../models/orderModel";
import mongoose from "mongoose";
import { fullMonthName } from "../utils/constants";
import { ICourse } from "../models/course.model";

export interface TRequest extends Request {
    user: { teacherId: string; username: string; role: string };
}

export const lastTwoMonthRevenue = async (req: TRequest, res: Response) => {
    try {
        // cast to ObjectId type else aggretation will will not work properly
        const teacherId = new mongoose.Types.ObjectId(req.user.teacherId);

        // calculate first and last data of current month
        const currentDate = new Date();
        const startOfCurrentMonth = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            1
        );

        // calcualte fist and last date of last month
        const startOfLastMonth = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth() - 1,
            1
        );
        const endOfLastMonth = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            0
        );

        const result = await orderModel.aggregate([
            { $unwind: "$coursesBought" },
            {
                $match: {
                    "coursesBought.teacherId": teacherId,
                },
            },
            {
                $facet: {
                    currentMonth: [
                        {
                            $match: {
                                createdAt: {
                                    $gt: startOfCurrentMonth,
                                    $lt: currentDate,
                                },
                            },
                        },
                        {
                            $group: {
                                _id: null,
                                totalRevenue: {
                                    $sum: "$coursesBought.teacherEarning",
                                },
                            },
                        },
                    ],
                    lastMonth: [
                        {
                            $match: {
                                createdAt: {
                                    $gt: startOfLastMonth,
                                    $lt: endOfLastMonth,
                                },
                            },
                        },
                        {
                            $group: {
                                _id: null,
                                totalRevenue: {
                                    $sum: "$coursesBought.teacherEarning",
                                },
                            },
                        },
                    ],
                },
            },
        ]);
        console.log(req.user, result);
        res.status(200).json({
            success: true,
            message: "revenue calculated successfully",
            result,
            revenue: {
                currentMonth: result[0]?.currentMonth[0]?.totalRevenue || 0,
                prevMonth: result[0]?.lastMonth[0]?.totalRevenue || 0,
            },
        });
    } catch (error) {
        logErrorMessage("error while calculating teacher revenue");
        logErrorMessage(error.message);
        console.log(error);
        res.status(400).json({
            success: false,
            message: "error while calculating revenue",
        });
    }
};

export const lastTwoMonthPurchaseCount = async (
    req: TRequest,
    res: Response
) => {
    try {
        const teacherId = new mongoose.Types.ObjectId(req.user.teacherId);

        // last and starting date of current month
        const now = new Date();
        const startOfCurrentMonth = new Date(
            now.getFullYear(),
            now.getMonth(),
            1
        );

        // start and ending date of last month
        const startOfLastMonth = new Date(
            now.getFullYear(),
            now.getMonth() - 1,
            1
        );
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        const result = await orderModel.aggregate([
            { $unwind: "$coursesBought" },
            { $match: { "coursesBought.teacherId": teacherId } },
            {
                $facet: {
                    currentMonth: [
                        {
                            $match: {
                                createdAt: {
                                    $gt: startOfCurrentMonth,
                                    $lt: now,
                                },
                            },
                        },
                        {
                            $count: "purchaseCount",
                        },
                    ],
                    lastMonth: [
                        {
                            $match: {
                                createdAt: {
                                    $gt: startOfLastMonth,
                                    $lt: endOfLastMonth,
                                },
                            },
                        },
                        {
                            $count: "purchaseCount",
                        },
                    ],
                },
            },
        ]);

        res.status(200).json({
            success: true,
            message: "purchase count successully fetched",
            purchases: {
                currentMonth: result[0]?.currentMonth[0]?.purchaseCount,
                prevMonth: result[0]?.lastMonth[0]?.purchaseCount,
            },
        });
    } catch (error) {
        logWarning(
            "error while fething course purchase count in last consequtice months"
        );
        logErrorMessage(error.message);
        console.log(error);
        res.status(400).json({
            success: false,
            message: "error while fething purchase count",
        });
    }
};

export const lifetimeEarning = async (req: TRequest, res: Response) => {
    try {
        const teacherId = new mongoose.Types.ObjectId(req.user.teacherId);
        const result = await orderModel.aggregate([
            { $unwind: "$coursesBought" },
            { $match: { "coursesBought.teacherId": teacherId } },
            {
                $group: {
                    _id: null,
                    lifetimeEarning: { $sum: "$coursesBought.teacherEarning" },
                },
            },
        ]);

        res.status(200).json({
            success: true,
            message: "lifetime earning successfully calculated",
            lifetimeEarning: result[0]?.lifetimeEarning || 0,
        });
    } catch (error) {
        logErrorMessage("error while calcualing lifetime earning of teacher");
        logErrorMessage(error.message);
        console.log(error);
        res.status(400).json({
            success: false,
            message: "error while calculating life time earning",
        });
    }
};

export const earnignByCourseNmonths = async (
    req: TRequest,
    res: Response
): Promise<any> => {
    try {
        const { months } = req.query as unknown as { months?: number };
        if (!months) {
            logWarning(
                "months filed missing in requset query to calculate earnings"
            );
            return res.status(400).json({
                success: false,
                message: "required parameter missinging in request",
            });
        }
        if (months < 0 || months > 12) {
            logWarning(
                "invalid invalid month value to calcualte earniing by months"
            );
            return res
                .status(400)
                .json({ success: false, message: "Invalid month" });
        }

        const now = new Date();
        const sixMonthAgo = new Date(
            now.getFullYear(),
            now.getMonth() - months + 1,
            1
        );

        const result = await orderModel.aggregate([
            { $match: { createdAt: { $gt: sixMonthAgo } } },
            { $unwind: "$coursesBought" },
            {
                $group: {
                    _id: {
                        courseId: "$coursesBought.courseId",
                        month: { $month: "$createdAt" },
                        year: { $year: "$createdAt" },
                    },
                    totalRevenue: { $sum: "$coursesBought.teacherEarning" },
                },
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1 },
            },
            {
                $lookup: {
                    from: "courses",
                    let: { courseId: "$_id.courseId" },
                    pipeline: [
                        { $match: { $expr: { $eq: ["$_id", "$$courseId"] } } },
                        { $project: { title: 1 } },
                    ],
                    as: "course",
                },
            },
        ]);

        const prettyfiedResult = result.map((entry) => {
            console.log(entry);
            return {
                _id: entry._id.courseId,
                courseName: entry.course[0]?.title,
                time: entry._id.year + "-" + fullMonthName[entry._id.month - 1],
                revenue: entry.totalRevenue,
            };
        });

        // console.log(prettyfiedResult);

        res.status(200).json({
            success: true,
            message:
                "earnig by course for last 6 months calulated successfully",
            result: prettyfiedResult,
        });
    } catch (error) {
        logErrorMessage(
            "error while calculating earning by course for 6 months"
        );
        logErrorMessage(error.message);
        console.log(error);
        res.status(400).json({
            success: false,
            message: "error while calculalating earning by course",
        });
    }
};

export const fetchTeacherSalesList = async (req: TRequest, res: Response) => {
    try {
        const { limit = 0, page = 1 } = req.query;

        const salesList = await orderModel
            .find(
                {
                    "coursesBought.teacherId": req.user.teacherId,
                },
                { coursesBought: 1, createdAt: 1 }
            )
            .populate({ path: "coursesBought.courseId", select: "title" });

        const prettySalesList = salesList.flatMap((sale) =>
            sale.coursesBought.map((course) => ({
                _id: course.courseId._id,
                courseName: (course.courseId as ICourse).title,
                soldPrice: course.soldPrice,
                revenue: course.teacherEarning,
                createdAt: sale.createdAt,
            }))
        );

        res.status(200).json({
            success: true,
            message: "sales list successuly fetched",
            salesList: prettySalesList,
        });
    } catch (error) {
        logErrorMessage("error while fetching teacher course sales list");
        logErrorMessage(error.message);
        console.log(error);
        res.status(400).json({
            success: false,
            message: "error while fething teacher sales list",
        });
    }
};
