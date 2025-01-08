import e, { Request, Response } from "express";
import { log, logErrorMessage, logWarning } from "../utils/log";
import orderModel from "./../models/orderModel";
import mongoose from "mongoose";

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

export const earnignByCourseNmonths = (req: TRequest, res: Response) => {
    try {
        res.status(200).json({
            success: true,
            message:
                "earnig by course for last 6 months calulated successfully",
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
