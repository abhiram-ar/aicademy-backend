import { Request, Response } from "express";
import teacherModel from "./../models/teacherModel";
import payoutModel from "./../models/payoutModel";
import { logErrorMessage } from "../utils/log";
import razorpayInstance from "../config/razorpay";
import { TRequest } from "./teacherDashboardControllers";

export const createBankVerificationOrder = async (
    req: Request | TRequest,
    res: Response
) => {
    try {
        const order = await razorpayInstance.orders.create({
            amount: 1 * 100,
            currency: "INR",
            notes: {
                teacherId: (req as TRequest).user.teacherId,
            },
        });
        res.status(200).json({
            success: true,
            message: "verification order succesfully created",
            order,
        });
    } catch (error) {
        logErrorMessage("error while creating bank verification order");
        logErrorMessage(error.message);
        console.log(error);
        res.status(400).json({
            success: false,
            message: "error while creacting bank verification order",
        });
    }
};

const verifyPaymentAndTecherBankAccount = (req: Request, res: Response) => {
    try {
    } catch (error) {
        logErrorMessage(
            "error while verifying payment and teacher bank account"
        );
        logErrorMessage(error.message);
        console.log(error);
        res.status(400).json({
            success: false,
            message: "error while verifying payment and bank account",
        });
    }
};
