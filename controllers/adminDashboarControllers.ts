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
    { id: string }
> = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            message: "platform earning calulated successfully",
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
