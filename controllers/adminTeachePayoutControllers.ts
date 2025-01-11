import { Request, Response } from "express";
import { logErrorMessage } from "../utils/log";

export const getPayoutList = (req: Request, res: Response) => {
    try {
        res.status(200).json({
            success: false,
            message: "payout list successfully fethched",
        });
    } catch (error) {
        logErrorMessage("error while fetching payout  list");
        logErrorMessage(error.message);
        if (!error.status) console.log(error);
        res.status(error.status ?? 400).json({
            success: false,
            messsage: error.status
                ? error.message
                : "error calculating fething payout  list",
        });
    }
};
