import { Request, Response } from "express";
import { logErrorMessage } from "../utils/log";
import payoutModel from "./../models/payoutModel";

export const getPayoutList = async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

        // fetch all payout transaction other than verifiaction transactions
        const result = await payoutModel
            .find({
                message: {
                    $ne: "Verifiacation Refund",
                },
            })
            .skip(skip)
            .limit(parseInt(limit as string))
            .populate({ path: "to", select: "legalName" })
            .sort({ isApproved: 1, createdAt: 1 });

        const totalEntries = await payoutModel.countDocuments({
            message: { $ne: "Verifiacation Refund" },
        });

        res.status(200).json({
            success: false,
            message: "payout list successfully fethched",
            length: result.length,
            pages: Math.ceil(totalEntries / parseInt(limit as string)),
            payoutList: result,
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
