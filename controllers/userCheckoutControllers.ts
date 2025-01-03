import { Request, Response } from "express";
import cartModel, { ICart } from "../models/cartModel";
import userModel from "./../models/userModel";
import razorpayInstance from "../config/razorpay";
import { URequest } from "./userCartControllers";
import { logErrorMessage, logSuccess, logWarning } from "../utils/log";
import crypto from "crypto";
import mongoose, { HydratedDocument } from "mongoose";
import courseModel, { ICourse } from "../models/course.model";
import teacherModel from "../models/teacherModel";

export const createOrder = async (
    req: URequest,
    res: Response
): Promise<any> => {
    try {
        const userId = req.user.userId;
        const cart = await cartModel
            .findOne({ userId })
            .populate({ path: "courses", select: "price" });

        if (!cart) {
            logWarning("cannot find user cart to create razorpay order");
            return res
                .status(404)
                .json({ success: false, message: "Invaid cart" });
        }

        // get cart sum
        const amount = cart.courses.reduce((total, current): number => {
            const course = current as unknown as { price: number };
            return total + course.price;
        }, 0);

        // todo: deduce amoount for coupon

        // create a razorpay order
        const orderDetails = await razorpayInstance.orders.create({
            amount: amount * 100,
            currency: "INR",
            notes: {
                customerId: userId as string,
                courses: cart.courses.map((course) => course._id).join(","),
            },
        });

        console.log(orderDetails);
        res.status(200).json({
            success: true,
            message: "order created successfully",
            orderDetails,
        });
    } catch (error) {
        logErrorMessage("error while creating razorpay order");
        logErrorMessage(error.message);
        console.log(error);
        return res.status(400).json({
            success: false,
            message: "error while creating razorpay order",
        });
    }
};

export const verifyPaymentAndCheckout = async (
    req: URequest,
    res: Response
): Promise<any> => {
    try {
        const {
            order_id,
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature,
        } = req.body;

        if (
            !order_id ||
            !razorpay_payment_id ||
            !razorpay_order_id ||
            !razorpay_signature
        ) {
            logWarning("required parameters missing for payment verification");
            return res.status(400).json({
                success: false,
                message: "required parameter missing for payement verification",
            });
        }

        const secretKey = process.env.RAZORPAY_KEY_SECRET as string;

        // generate signature for verifiaction
        const hmac = crypto.createHmac("sha256", secretKey);
        hmac.update(order_id + "|" + razorpay_payment_id);
        const generatedSignature = hmac.digest("hex");

        if (generatedSignature !== razorpay_signature) {
            logWarning("payment signature dont match");
            return res.status(403).json({
                success: false,
                message: "Payment signature does not match",
            });
        }

        const session = await mongoose.startSession();

        try {
            session.startTransaction();

            const user = await userModel.findById(req.user.userId);
            if (!user) throw Error("Valid user not found for checkout");

            const userCart = await cartModel
                .findOne({
                    userId: req.user.userId,
                })
                .populate({ path: "courses", select: "createdBy price" });
            if (!userCart) throw Error("User cart not found");
            console.log("usercart checkout", userCart);

            // update the user courses they bought
            await user.updateOne({
                $addToSet: { coursesBought: { $each: userCart.courses } },
            });

            // update the metadata on the course
            await courseModel.updateMany(
                { _id: { $in: userCart.courses } },
                {
                    $inc: { boughtCount: 1 },
                }
            );

            // update the teacher earning
            // sequential executtion to await to avoid race conditions
            for (const item of userCart.courses) {
                const course = item as ICourse;
                await teacherModel.findOneAndUpdate(
                    { _id: course.createdBy },
                    { $inc: { earnings: (course.price * 70) / 100 } }
                );
            }

            //clear user cart
            await userCart.updateOne({ courses: [] });

            await session.endSession();
            logSuccess("Checkout transaction successful");
            return res.status(200).json({
                success: true,
                message: "payment verified successfully",
            });
        } catch (error) {
            await session.abortTransaction();
            await session.endSession();
            logErrorMessage("checkout transation failed");
            logErrorMessage(error.message);
            return res.status(400).json({
                success: false,
                message: "error while checkout",
            });
        } finally {
            await session.endSession();
        }
    } catch (error) {
        logErrorMessage("error while verifying payment");
        logErrorMessage(error.message);
        console.log(error);
        return res.status(400).json({
            success: false,
            message: "error while verifying payment",
        });
    }
};
