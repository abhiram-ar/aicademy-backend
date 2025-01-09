import { Request, Response } from "express";
import teacherModel from "./../models/teacherModel";
import payoutModel from "./../models/payoutModel";
import { logErrorMessage, logWarning } from "../utils/log";
import razorpayInstance from "../config/razorpay";
import { TRequest } from "./teacherDashboardControllers";
import crypto from "crypto";
import mongoose from "mongoose";

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

export const verifyPaymentAndTecherBankAccount = async (
    req: Request,
    res: Response
): Promise<any> => {
    try {
        const {
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature,
            order_id,
        } = req.body;

        if (
            !razorpay_payment_id ||
            !razorpay_order_id ||
            !razorpay_signature ||
            !order_id
        ) {
            logWarning(
                "requied parameter missing for bank details verification"
            );
            res.status(200).json({
                success: false,
                message: "required parameter missing",
            });
        }

        // verify payment
        const secretKey = process.env.RAZORPAY_KEY_SECRET as string;
        const hmac = crypto.createHmac("sha256", secretKey);
        hmac.update(order_id + "|" + razorpay_payment_id);
        const generatedSignature = hmac.digest("hex");

        if (generatedSignature !== razorpay_signature) {
            logErrorMessage(
                "paymeent signature dont match for teacher bank verification"
            );
            return res
                .status(403)
                .json({ success: false, message: "Invalid payment signature" });
        }

        const payementDetails = await razorpayInstance.payments.fetch(
            razorpay_payment_id
        );

        const teacherId = (req as TRequest).user.teacherId;
        await teacherModel.findByIdAndUpdate(teacherId, {
            isBankVerified: true,
            vpa: payementDetails.vpa,
        });

        await payoutModel.create({
            to: teacherId,
            amount: 1,
            message: "Verifiacation Refund",
            isApproved: true,
            status: "deposited",
        });

        res.status(200).json({
            success: true,
            message: "veification successful",
        });
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

export const getBankVerificationStatus = async (
    req: Request,
    res: Response
): Promise<any> => {
    try {
        const result = await teacherModel.findById(
            (req as TRequest).user.teacherId,
            { isBankVerified: 1 }
        );

        if (!result) {
            logWarning("getBankVerification: no teacher found");
            return res
                .status(404)
                .json({ success: false, message: "invalid teacherID" });
        }

        res.status(200).json({
            success: true,
            messsage: "veficication staus successfully fetched",
            isVerified: result.isBankVerified ?? false,
        });
    } catch (error) {
        logErrorMessage("error while fethcing bankverification status");
        logErrorMessage(error.message);
        console.log(error);
        res.status(400).json({
            success: false,
            message: "error while fetching bank verfication status",
        });
    }
};

export const teacherPayoutHistoryList = async (req: Request, res: Response) => {
    try {
        const teacherId = (req as TRequest).user.teacherId;
        const result = await payoutModel.find({ to: teacherId });

        res.status(200).json({
            success: false,
            message: "teacher payoutlist successfully fetched",
            payoutHistroy: result,
        });
    } catch (error) {
        logErrorMessage("error while fetching techer payout histoy");
        logErrorMessage(error.message);
        console.log(error);
        res.status(400).json({
            success: false,
            message: "error while fetching teacher payout histoty",
        });
    }
};

export const withdrawableAmountAndTotalCashedout = async (
    req: Request,
    res: Response
) => {
    try {
        const teacherId = (req as TRequest).user.teacherId;
        const result = await teacherModel.findById(teacherId, {
            totalAmountCheckedOut: 1,
            earnings: 1,
        });

        if (!result) {
            logWarning("no teacher found for calculating withdrawable amount");
            res.status(404).json({
                success: false,
                message: "Invalid teacher",
            });
        }

        res.status(200).json({
            success: true,
            message: "withdraw amount and total cashedout successfully fetched",
            withdrawable: result?.earnings || 0,
            totalAmountCheckedout: result?.totalAmountCheckedOut || 0,
        });
    } catch (error) {
        logErrorMessage("error while caculating withdaw amounts");
        logErrorMessage(error.message);
        console.log(error);
        res.status(400).json({
            success: false,
            message: "error while feching withdraw amounts",
        });
    }
};

export const withdraw = async (req: TRequest, res: Response): Promise<any> => {
    try {
        const { withdrawAmount } = req.body;
        if (!withdrawAmount) {
            logWarning("no withdarawAmount in request");
            return res.status(400).json({
                success: false,
                message: "withdraw amount is missing in request",
            });
        }

        const teacher = await teacherModel.findById(req.user.teacherId);
        if (!teacher) {
            logWarning("no teacher found for withdrawing amount");
            return res.status(404).json({
                success: false,
                message: "Invalid teacher",
            });
        }

        if (
            withdrawAmount < 1000 ||
            withdrawAmount > (teacher?.earnings || 0)
        ) {
            logWarning("Invalid withdraw amount");
            return res.status(400).json({
                success: false,
                message: "Invalid withdraw amount",
            });
        }

        const session = await mongoose.startSession();
        try {
            session.startTransaction();

            // decrement the earnings from teacher and increment totalCheckedout
            await teacher.updateOne(
                {
                    $inc: {
                        earnings: -withdrawAmount,
                        totalAmountCheckedOut: withdrawAmount,
                    },
                },
                { session } //incude this update in this session, since teacher is reference outside of this session
            );

            // create a transaction
            await payoutModel.create({
                to: teacher.id,
                amount: withdrawAmount,
                message: `Payout requested by teacher`,
            });

            await session.commitTransaction();
            await session.endSession();
            res.status(200).json({
                success: true,
                message: "withdraw successful",
            });
        } catch (error) {
            await session.abortTransaction();
            await session.endSession();
            logErrorMessage("error while withdraw transaction");
            logErrorMessage(error.message);
            console.log(error);
            res.status(400).json({
                success: false,
                message: "error while withdraw transaction",
            });
        }
    } catch (error) {
        logErrorMessage("error while withdrawing");
        logErrorMessage(error.message);
        console.log(error);
        res.status(400).json({
            success: false,
            message: "error while withdrawing",
        });
    }
};
