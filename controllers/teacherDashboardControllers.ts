import { Request, Response } from "express";
import { logErrorMessage } from "../utils/log";
import orderModel from "./../models/orderModel";

export const lastTwoMonthRevenue = async (req: Request, res: Response) => {
    try {
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

        const result = await orderModel.aggregate([{ $unwind: "$courseBought" }]);
        console.log(result);
        res.status(200).json({
            success: true,
            message: "revenue calculated successfully",
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
