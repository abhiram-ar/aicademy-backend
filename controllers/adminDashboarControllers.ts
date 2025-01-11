import orderModel from "../models/orderModel";
import { Request, RequestHandler, Response } from "express";
import { logErrorMessage } from "../utils/log";

export const overviewReportLastTwoMonth = async (
    req: Request,
    res: Response
) => {
    try {
        const currentTime = new Date();
        const startingOfThisMonth = new Date(
            currentTime.getFullYear(),
            currentTime.getMonth(),
            1
        );

        // starting and ending of previous month
        const startingOfLastMonth = new Date(
            currentTime.getFullYear(),
            currentTime.getMonth() - 1,
            1
        );
        const endingOfLastMonth = new Date(
            currentTime.getFullYear(),
            currentTime.getMonth(),
            0
        );

        const result = await orderModel.aggregate([
            {
                $match: {
                    createdAt: { $lte: currentTime, $gte: startingOfLastMonth },
                },
            },
            {
                $project: {
                    createdAt: 1,
                    coursesBought: 1,
                    orderValue: 1,
                    platformFee: 1,
                },
            },
            {
                $addFields: {
                    month: {
                        $month: "$createdAt",
                    },
                    year: { $year: "$createdAt" },
                },
            },
            {
                $group: {
                    _id: { month: "$month", year: "$year" },
                    totalRevenue: { $sum: "$orderValue" },
                    totalProfit: { $sum: "$platformFee" },
                    totalSales: { $sum: { $size: "$coursesBought" } },
                },
            },
            { $sort: { "_id.year": -1, "_id.month": -1 } },
        ]);

        res.status(200).json({
            success: true,
            message: "overview report successfully fetched",
            currentMonthReport: result[0],
            prevMonthReport: result[1],
        });
    } catch (error) {
        logErrorMessage("error while fetching report overview");
        logErrorMessage(error.message);
        if (!error.status) console.log(error);
        res.status(error.status ?? 400).json({
            success: false,
            messsage: error.status
                ? error.message
                : "error while fething report overview",
        });
    }
};

export const calculateRevenueAndProfit: RequestHandler<
    {},
    {},
    {},
    { interval?: "monthly" | "daily" }
> = async (req, res) => {
    try {
        const { interval } = req.query;
        if (!interval) {
            throw { message: "interval mising in request query", status: 400 };
        }
        if (!(interval === "monthly" || interval === "daily")) {
            throw {
                message: "interval should be 'monthly' or 'daily'",
                status: 404,
            };
        }

        // aggregation query cofigs
        const now = new Date();
        let startDate: Date;
        let groupBy: any;

        if (interval === "monthly") {
            startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
            groupBy = {
                year: { $year: "$createdAt" },
                month: { $month: "$createdAt" },
            };
        } else {
            // 28 days before
            startDate = new Date();
            startDate.setDate(now.getDate() - 27);
            groupBy = {
                year: { $year: "$createdAt" },
                month: { $month: "$createdAt" },
                day: { $dayOfMonth: "$createdAt" },
            };
        }

        const result = await orderModel.aggregate([
            { $match: { createdAt: { $gte: startDate, $lte: now } } },
            { $project: { createdAt: 1, orderValue: 1, platformFee: 1 } },
            {
                $group: {
                    _id: groupBy,
                    revenue: { $sum: "$orderValue" },
                    profit: { $sum: "$platformFee" },
                },
            },
            {
                $project: {
                    _id: 0,
                    period: {
                        $concat: [
                            { $toString: "$_id.year" },
                            "-",
                            { $toString: "$_id.month" },
                            interval === "daily"
                                ? { $concat: ["-", { $toString: "$_id.day" }] }
                                : "",
                        ],
                    },
                    revenue: 1,
                    profit: 1,
                },
            },
            {
                $sort: { period: 1 },
            },
        ]);

        res.status(200).json({
            success: true,
            message: "platform earning calulated successfully",
            data: result,
        });
    } catch (error) {
        logErrorMessage("error while calculating admin revenue and profit");
        logErrorMessage(error.message);
        if (!error.status) console.log(error);
        res.status(error.status ?? 400).json({
            success: false,
            messsage: error.status
                ? error.message
                : "error calculating admin revenue and profit",
        });
    }
};

export const reveueList = async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

        const result = await orderModel
            .find({}, { createdAt: 1, orderValue: 1, platformFee: 1 })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit as string))
            .lean();

        const totalEntries = await orderModel.countDocuments();

        res.status(200).json({
            success: true,
            messsage: "revenue list successfully fetched",
            pages: Math.ceil(totalEntries / parseInt(limit as string)),
            data: result,
        });
    } catch (error) {
        logErrorMessage("error while fetching revenue list");
        logErrorMessage(error.message);
        if (!error.status) console.log(error);
        res.status(error.status ?? 400).json({
            success: false,
            messsage: error.status
                ? error.message
                : "error calculating fething revenue list",
        });
    }
};
