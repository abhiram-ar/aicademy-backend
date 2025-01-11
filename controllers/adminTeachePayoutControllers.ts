import { Request, RequestHandler, Response } from "express";
import { logErrorMessage } from "../utils/log";
import payoutModel from "./../models/payoutModel";
import mongoose from "mongoose";
import teacherModel from "../models/teacherModel";

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
            .sort({ isApproved: 1, updatedAt: -1 });

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

export const updatePayoutApprovalStatus: RequestHandler<
    {},
    {},
    { payoutId?: string; newStatus?: Boolean }
> = async (req, res) => {
    try {
        const { payoutId, newStatus } = req.body;
        if (!payoutId) {
            throw {
                message: "required filed missing in request body",
                status: 400,
            };
        }

        if (typeof newStatus !== "boolean") {
            throw { message: "newStatus should be boolen", status: 400 };
        }

        const session = await mongoose.startSession();
        try {
            session.startTransaction();

            const result = await payoutModel.findByIdAndUpdate(
                payoutId,
                {
                    isApproved: true,
                    status: newStatus ? "deposited" : "cancelled",
                },
                { new: true, session }
            );
            if (!result) throw { message: "Invalid payoutID", status: 404 };

            if (result.status === "cancelled" || result.status === "failed") {
                await teacherModel.findByIdAndUpdate(result.to, {
                    earnings: { $inc: result.amount },
                    totalAmountCheckedOut: { $inc: -result.amount },
                });
            } else if (result.status === "deposited") {
                await teacherModel.findByIdAndUpdate(result.to, {
                    $inc: { totalAmountCheckedOut: result.amount },
                });
            } else {
                throw { message: "invalid payout status ", status: 400 };
            }
            session.commitTransaction();
            session.endSession();

            res.status(200).json({
                success: true,
                message: "payout approval status updated",
            });
        } catch (error) {
            logErrorMessage("error while payout transaction");
            await session.abortTransaction();
            await session.endSession();
            throw error;
        }
    } catch (error) {
        logErrorMessage("error while updatign approval status");
        logErrorMessage(error.message);
        if (!error.status) console.log(error);
        res.status(error.status ?? 400).json({
            success: false,
            messsage: error.status
                ? error.message
                : "errerror while updatign approval status",
        });
    }
};
