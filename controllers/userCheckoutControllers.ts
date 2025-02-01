import { Request, Response } from "express";
import cartModel, { ICart } from "../models/cartModel";
import userModel from "./../models/userModel";
import razorpayInstance from "../config/razorpay";
import { URequest } from "./userCartControllers";
import { logErrorMessage, logSuccess, logWarning } from "../utils/log";
import crypto from "crypto";
import mongoose, { HydratedDocument, ObjectId } from "mongoose";
import courseModel, { ICourse } from "../models/course.model";
import teacherModel from "../models/teacherModel";
import couponModel, { ICoupon } from "../models/couponModel";
import orderModel from "../models/orderModel";

export const createOrder = async (req: URequest, res: Response): Promise<any> => {
    try {
        const userId = req.user.userId;
        const cart = await cartModel
            .findOneAndUpdate({ userId, status: "active" }, { $set: { status: "processing" } })
            .populate({ path: "courses", select: "price" })
            .populate("couponApplied");

        if (!cart) {
            logWarning("This cart is already being checkout");
            return res.status(404).json({
                success: false,
                message: "Invaid ",
                errorMessage: "This cart is already being checkedout, please try again later",
            });
        }

        console.log(cart);

        // get cart sum
        let amount = cart.totalAmount().totalPrice;

        // deduce amoount for coupon
        const couponDetails: { code?: string; couponDiscount?: number } = {};
        if (cart.couponApplied) {
            const appliedCoupon = cart.couponApplied as ICoupon;
            const validationResult = appliedCoupon.validateCoupon();

            // remove coupon if coupon is invalid
            if (!validationResult.success || appliedCoupon.minPurchaseAmount > amount) {
                logWarning(
                    validationResult?.error?.message ??
                        "orderCreation: cart total less than coupon minAmount, removing coupon"
                );
                await cart.updateOne({ $unset: { couponApplied: "" } });
                return res.status(400).json({
                    success: false,
                    messsage: "Invalid coupon while checkout",
                    errorMessage: "Invalid coupon",
                });
            }
            // calculate discount
            else {
                couponDetails.code = appliedCoupon.code;
                couponDetails.couponDiscount = Math.min(
                    appliedCoupon.maxDiscountAmount,
                    (amount * appliedCoupon.discount) / 100
                );
                amount -= couponDetails.couponDiscount;
            }
        }

        // create a razorpay order
        const orderDetails = await razorpayInstance.orders.create({
            amount: amount * 100,
            currency: "INR",
            notes: {
                customerId: userId as string,
                courses: cart.courses.map((course) => course._id).join(","),
                coupondDiscount: couponDetails.couponDiscount ? couponDetails.couponDiscount : null,
                couponApplied: couponDetails.code ? couponDetails.code : null,
            },
        });

        console.log(cart);
        res.status(200).json({
            success: true,
            message: "order created successfully",
            orderDetails,
            couponDetails: Object.keys(couponDetails).length > 0 ? couponDetails : null,
        });
        setTimeout(async () => {
            logWarning("clearing cart processing state");
            await cartModel.findOneAndUpdate(
                { userId: req.user.userId, status: "active" },
                { $set: { status: "active" } }
            );
        }, 12 * 60 * 1000);
    } catch (error) {
        logErrorMessage("error while creating razorpay order");
        logErrorMessage(error.message);
        console.log(error);
        await cartModel.findOneAndUpdate(
            { userId: req.user.userId },
            { $set: { status: "active" } }
        );
        return res.status(400).json({
            success: false,
            message: "error while creating razorpay order",
        });
    }
};

type Torder = {
    orderDetails: {
        amount: number;
        amount_due: number;
        amount_paid: number;
        currency: "INR";
        notes: {
            couponApplied?: string;
            coupondDiscount?: number;
            courses: string[];
            customerId: string;
        };
        receipt: null;
    };
    couponDetails?: {
        code: string;
        couponDiscount: number;
    };
};

export const removeCartLock = async (req: URequest, res: Response): Promise<any> => {
    try {
        await cartModel.findOneAndUpdate(
            { userId: req.user.userId },
            { $set: { status: "active" } }
        );
    } catch (error) {
        logErrorMessage("error while removing lock from cart");
        console.log(error);
        return res
            .status(400)
            .json({ success: false, message: "error while removing lock from cart" });
    }
};

export const verifyPaymentAndCheckout = async (req: URequest, res: Response): Promise<any> => {
    try {
        const { order_id, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

        if (!order_id || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
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

        const orderDetails: Torder = req.body.order;

        const session = await mongoose.startSession();

        try {
            session.startTransaction();

            const user = await userModel.findById(req.user.userId);
            if (!user) throw Error("Valid user not found for checkout");

            const userCart = await cartModel
                .findOne({
                    userId: req.user.userId,
                })
                .populate({ path: "courses", select: "createdBy price" })
                .populate("couponApplied");
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
            // sequential executtion by for..of loop and await to avoid race conditions
            // earrnig of techer 70% of couse value
            const coursesBoughtDetails: {
                courseId: string;
                soldPrice: number;
                teacherId: string;
                teacherEarning: number;
            }[] = [];
            for (const item of userCart.courses) {
                const course = item as ICourse;

                const courseProfit = (course.price * 70) / 100;
                coursesBoughtDetails.push({
                    courseId: course.id,
                    soldPrice: course.price,
                    teacherId: course.createdBy as unknown as string,
                    teacherEarning: courseProfit,
                });

                await teacherModel.findOneAndUpdate(
                    { _id: course.createdBy },
                    {
                        $inc: {
                            earnings: courseProfit,
                        },
                    }
                );
            }

            // crete order-transaction entry
            await orderModel.create({
                userId: userCart.userId,
                coursesBought: coursesBoughtDetails,
                coupon: orderDetails.couponDetails
                    ? {
                          couponApplied: true,
                          couponCode: orderDetails.couponDetails.code,
                          couponDiscountAmount: orderDetails.couponDetails.couponDiscount,
                      }
                    : { couponApplied: false },
                paymentDetails: {
                    razorpayPaymentId: razorpay_payment_id,
                    razorpayOrderId: razorpay_order_id,
                    razorpaySignature: razorpay_signature,
                    razorpayFee: ((orderDetails.orderDetails.amount / 100) * 2) / 100, // razorpay fee is included in plaftfrom fee
                    GST: ((((orderDetails.orderDetails.amount / 100) * 2) / 100) * 18) / 100,
                    receipt: orderDetails.orderDetails.receipt,
                    notes: orderDetails.orderDetails.notes,
                },

                currency: orderDetails.orderDetails.currency,
                orderValue: orderDetails.orderDetails.amount / 100,
                totalDiscount: orderDetails.couponDetails?.couponDiscount || 0,
                platformFee:
                    ((orderDetails.orderDetails.amount / 100) * 30) / 100 +
                    (orderDetails.couponDetails
                        ? (orderDetails.couponDetails.couponDiscount * -70) / 100
                        : 0), // plaftform fee = 30% cart value - coupon discount
            });

            // update coupon usage Details,
            if (orderDetails.couponDetails) {
                await couponModel.findOneAndUpdate(
                    {
                        code: orderDetails.couponDetails.code,
                    },
                    {
                        $addToSet: { usedBy: req.user.userId },
                    }
                );
            }

            // clear user cart
            await userCart.updateOne({
                courses: [],
                $unset: { couponApplied: "" },
            });

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
            // reset cart state
            await cartModel.findOneAndUpdate(
                { userId: req.user.userId },
                { $set: { status: "active" } }
            );
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
