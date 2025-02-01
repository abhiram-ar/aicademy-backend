import { Request, RequestHandler, Response } from "express";
import { logErrorMessage, logWarning } from "../utils/log";
import cartModel, { ICart } from "../models/cartModel";
import courseModel, { ICourse } from "../models/course.model";
import couponModel, { ICoupon } from "../models/couponModel";
import userModel from "../models/userModel";
import wishlistModel from "../models/wishlistModel";
import mongoose from "mongoose";

export interface URequest extends Request {
    file: any;
    user: {
        userId?: string;
        username: string;
    };
}

export const getCart = async (req: URequest, res: Response): Promise<any> => {
    try {
        const { userId } = req.user;
        if (!userId) {
            return res.status(400).json({
                success: false,
                messsage: "userId missing to fetch cart details",
            });
        }

        let cartDetails = await cartModel
            .findOne({ userId })
            .populate({
                path: "courses",
                select: "title description createdBy level price estimatedPrice rating totalRatingCount category thumbnail lessonCount",
            })
            .populate("couponApplied");

        // if cart does not exist in DB create a new cart,
        // since user is autheicated and authorized, cart is created safely
        if (!cartDetails) {
            cartDetails = await cartModel.create({ userId });
        }

        const totalAmount = cartDetails.totalAmount();

        const couponDetails: any = {};
        if (cartDetails.couponApplied) {
            const appliedCoupon = cartDetails.couponApplied as ICoupon;
            const validationResult = appliedCoupon.validateCoupon();

            // remove coupon if coupon is invalid
            if (
                !validationResult.success ||
                appliedCoupon.minPurchaseAmount > totalAmount.totalPrice
            ) {
                logWarning(
                    validationResult?.error?.message ??
                        "cart total less than coupon minAmount, removing coupon"
                );
                await cartDetails.updateOne({ $unset: { couponApplied: "" } });
                cartDetails.couponApplied = null;
            }
            // calculate discount
            else {
                couponDetails.code = appliedCoupon.code;
                couponDetails.couponDiscount = Math.min(
                    appliedCoupon.maxDiscountAmount,
                    (totalAmount.totalPrice * appliedCoupon.discount) / 100
                );
                totalAmount.totalPrice -= couponDetails.couponDiscount;
            }
        }

        return res.status(200).json({
            success: true,
            message: "cart fetch successful",
            length: cartDetails.courses.length,
            cart: cartDetails?.courses,
            cartId: cartDetails._id,
            cartStatus: cartDetails.status,
            coupon: couponDetails,
            totalAmount,
        });
    } catch (error) {
        logErrorMessage("error while fetching/creating cart");
        logErrorMessage(error.message);
        return res.status(400).json({
            success: false,
            message: "Error while creating or fetching cart details",
        });
    }
};

export const addToCart = async (req: URequest, res: Response): Promise<any> => {
    try {
        const { courseId } = req.body;
        if (!courseId) {
            logWarning(`courseId not provided for adding to cart`);
            return res.status(400).json({
                success: false,
                message: "courseId is not provided in request",
            });
        }

        const course = await courseModel.findById(courseId);
        if (!course) {
            logWarning(`add to cart: Invalid courseId`);
            return res.status(404).json({ success: false, message: "Invalid courseId" });
        }

        const hasUserBoughtThisCourse = await userModel.findOne(
            {
                _id: req.user.userId,
                coursesBought: courseId,
            },
            { coursesBought: 1 }
        );
        console.log(hasUserBoughtThisCourse);

        if (hasUserBoughtThisCourse) {
            logWarning("cannot add to cart courses alredy bought by the user");
            return res.status(400).json({
                success: false,
                message: "cannot add courses that is alredy bought by the user",
            });
        }

        const cartUpdateResult = await cartModel.findOneAndUpdate(
            { userId: req.user.userId },
            { $addToSet: { courses: courseId } },
            { upsert: true } //create the cart if it does not exist
        );

        console.log(cartUpdateResult);

        return res.status(200).json({
            success: true,
            message: "course added to cart successfully",
        });
    } catch (error) {
        logErrorMessage(`error while adding to cart`);
        logErrorMessage(error.message);
        return res.status(400).json({ success: false, message: "error while adding to cart" });
    }
};

export const removeFromCart = async (req: URequest, res: Response): Promise<any> => {
    try {
        const { courseId } = req.body;
        if (!courseId) {
            logWarning("missing parameter to remove from cart: courseId ");
            return res.status(400).json({
                success: false,
                message: "courseId misisng in request",
            });
        }

        const cartUpdateResult = await cartModel.findOneAndUpdate(
            { userId: req.user.userId },
            { $pull: { courses: courseId } }
        );

        console.log(cartUpdateResult);
        return res.status(200).json({
            success: true,
            message: "course successflly removed from the cart",
        });
    } catch (error) {
        logErrorMessage("Error while removing course from cart");
        logErrorMessage(error.message);
        console.log(error);
        return res.status(400).json({
            success: false,
            message: "errro while removing course from cart",
        });
    }
};

export const moveToWishlist = async (req: URequest, res: Response): Promise<any> => {
    try {
        const { courseId } = req.body;
        if (!courseId) {
            logWarning(`courseId not provided for moving to wishlist`);
            return res.status(400).json({
                success: false,
                message: "courseId is not provided in request",
            });
        }

        const course = await courseModel.findById(courseId);
        if (!course) {
            logWarning(`move to wishlist: Invalid courseId`);
            return res.status(404).json({ success: false, message: "Invalid courseId" });
        }

        const hasUserBoughtThisCourse = await userModel.findOne(
            {
                _id: req.user.userId,
                coursesBought: courseId,
            },
            { coursesBought: 1 }
        );

        if (hasUserBoughtThisCourse) {
            logWarning(
                "cannot move to wishlist. courses alredy bought by the user, removing course from cart"
            );
            await cartModel.findOneAndUpdate(
                { userId: req.user.userId },
                { $pull: { courses: courseId } }
            );
            return res.status(400).json({
                success: false,
                message: "cannot add courses that is alredy bought by the user",
            });
        }

        const wishlistUpdateResult = await wishlistModel.findOneAndUpdate(
            { userId: req.user.userId },
            { $addToSet: { courses: courseId } },
            { upsert: true } //create the cart if it does not exist
        );

        if (!wishlistUpdateResult) {
            return res.status(404).json({
                success: false,
                message: "Invalid courseId",
            });
        }

        await cartModel.findOneAndUpdate(
            { userId: req.user.userId },
            { $pull: { courses: courseId } }
        );

        return res.status(200).json({
            success: true,
            message: "course added to cart successfully",
        });
    } catch (error) {
        logErrorMessage(`error while adding to wishlist`);
        logErrorMessage(error.message);
        return res.status(400).json({
            success: false,
            message: "error while adding to wishlist",
        });
    }
};

export const applyCoupon = async (req: URequest, res: Response): Promise<any> => {
    try {
        const { code } = req.body;
        if (!code) {
            throw {
                message: "coupon 'code' is missing",
                type: "checked",
            };
        }

        const coupon = await couponModel.findOne({ code: code });
        if (!coupon) {
            throw { message: "Invalid coupon", type: "checked" };
        }
        console.log(coupon);

        // user cannot use the coupon they alredy used
        if (coupon.usedBy.includes(new mongoose.Types.ObjectId(req.user.userId))) {
            logWarning("User trying to use coupon they alredy use");
            throw {
                message: "You already claimed this coupon",
                type: "checked",
            };
        }

        // check coupon validity
        const validationResult = coupon.validateCoupon();
        if (!validationResult.success) {
            throw validationResult.error;
        }

        const userCart = await cartModel
            .findOne({ userId: req.user.userId })
            .populate({ path: "courses", select: "price estimatedPrice" });
        if (!userCart) {
            throw { message: "cannot find user cart", type: "checked" };
        }

        const cartTotal = userCart.totalAmount().totalPrice;
        if (cartTotal < coupon.minPurchaseAmount) {
            throw {
                message: `min cart value should be ₹${coupon.minPurchaseAmount}`,
                type: "checked",
            };
        }

        // apply coupon to cart
        userCart.couponApplied = coupon.id;
        await userCart.save();

        res.status(200).json({
            success: true,
            message: "coupon applied successfully",
        });
    } catch (error) {
        logErrorMessage("error while applying coupon");
        logErrorMessage(error.message);
        console.log(error);
        res.status(400).json({
            success: false,
            message: "Error while applying coupon",
            errorMessage: error?.type === "checked" && error.message,
        });
    }
};

export const removeCouponFromCart = async (req: URequest, res: Response): Promise<any> => {
    console.log("hit remove");
    try {
        await cartModel.findOneAndUpdate(
            { userId: req.user.userId },
            { $unset: { couponApplied: "" } }
        );
        res.status(200).json({
            success: true,
            message: "coupon removed from cart",
        });
    } catch (error) {
        logErrorMessage("error while removing coupon from cart");
        logErrorMessage(error.message);
        console.log(error);
        return res.status(400).json({
            success: false,
            message: "error while removing coupon from cart",
        });
    }
};
