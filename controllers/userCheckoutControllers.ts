import { Request, Response } from "express";
import cartModel from "../models/cartModel";
import userModel from "./../models/userModel";
import razorpayInstance from "../config/razorpay";
import { URequest } from "./userCartControllers";
import { logErrorMessage, logWarning } from "../utils/log";

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
