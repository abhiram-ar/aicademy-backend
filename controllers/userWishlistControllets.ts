import { Request, RequestHandler, Response } from "express";
import { logErrorMessage, logWarning } from "../utils/log";
import courseModel, { ICourse } from "../models/course.model";
import couponModel, { ICoupon } from "../models/couponModel";
import userModel from "../models/userModel";
import wishlistModel from "../models/wishlistModel";
import cartModel from "../models/cartModel";

export interface URequest extends Request {
    file: any;
    user: {
        userId?: string;
        username: string;
    };
}

export const getWishlist = async (
    req: URequest,
    res: Response
): Promise<any> => {
    try {
        const { userId } = req.user;
        if (!userId) {
            return res.status(400).json({
                success: false,
                messsage: "userId missing to fetch wishlist details",
            });
        }

        let wishlistDetails = await wishlistModel.findOne({ userId }).populate({
            path: "courses",
            select: "title description createdBy level price estimatedPrice thumbnail rating totalRatingCount category lessonCount",
        });

        // if cart does not exist in DB create a new cart,
        // since user is autheicated and authorized, cart is created safely
        if (!wishlistDetails) {
            wishlistDetails = await wishlistModel.create({ userId });
        }

        return res.status(200).json({
            success: true,
            message: "cart fetch successful",
            length: wishlistDetails.courses.length,
            wishlist: wishlistDetails?.courses,
            wishlistId: wishlistDetails._id,
        });
    } catch (error) {
        logErrorMessage("error while fetching/creating wishlist");
        logErrorMessage(error.message);
        return res.status(400).json({
            success: false,
            message: "Error while creating or fetching wishlist details",
        });
    }
};

export const addToWishlist = async (
    req: URequest,
    res: Response
): Promise<any> => {
    try {
        const { courseId } = req.body;
        if (!courseId) {
            logWarning(`courseId not provided for adding to wishlist`);
            return res.status(400).json({
                success: false,
                message: "courseId is not provided in request",
            });
        }

        const course = await courseModel.findById(courseId);
        if (!course) {
            logWarning(`add to wishlist: Invalid courseId`);
            return res
                .status(404)
                .json({ success: false, message: "Invalid courseId" });
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
                "cannot add to wishlist. courses alredy bought by the user"
            );
            return res.status(400).json({
                success: false,
                message: "cannot add courses that is alredy bought by the user",
            });
        }

        const cartUpdateResult = await wishlistModel.findOneAndUpdate(
            { userId: req.user.userId },
            { $addToSet: { courses: courseId } },
            { upsert: true } //create the cart if it does not exist
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

export const removeFromWishlist = async (
    req: URequest,
    res: Response
): Promise<any> => {
    try {
        const { courseId } = req.body;
        if (!courseId) {
            logWarning("missing parameter to remove from wishlist: courseId ");
            return res.status(400).json({
                success: false,
                message: "courseId misisng in request",
            });
        }

        const wishlistUpdateResult = await wishlistModel.findOneAndUpdate(
            { userId: req.user.userId },
            { $pull: { courses: courseId } }
        );

        return res.status(200).json({
            success: true,
            message: "course successflly removed from the wishlist",
        });
    } catch (error) {
        logErrorMessage("Error while removing course from wishlist");
        logErrorMessage(error.message);
        console.log(error);
        return res.status(400).json({
            success: false,
            message: "errro while removing course from wishlist",
        });
    }
};

export const moveToCart = async (
    req: URequest,
    res: Response
): Promise<any> => {
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
            return res
                .status(404)
                .json({ success: false, message: "Invalid courseId" });
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
                "cannot add to cart courses alredy bought by the user, removing course from wishlist"
            );
            await wishlistModel.findOneAndUpdate(
                { userId: req.user.userId },
                { $pull: { courses: courseId } }
            );
            return res.status(400).json({
                success: false,
                message: "cannot add courses that is alredy bought by the user",
            });
        }

        const cartUpdateDetails = await cartModel.findOneAndUpdate(
            { userId: req.user.userId },
            { $addToSet: { courses: courseId } },
            { upsert: true } //create the cart if it does not exist
        );

        if (!cartUpdateDetails) {
            logWarning("invalid courseId");
            res.status(404).json({
                success: false,
                message: "invalid courseId",
            });
        }

        await wishlistModel.findOneAndUpdate(
            { userId: req.user.userId },
            { $pull: { courses: courseId } }
        );

        return res.status(200).json({
            success: true,
            message: "course moved to cart from wishlist successfully",
        });
    } catch (error) {
        logErrorMessage(`error while moving to cart`);
        logErrorMessage(error.message);
        return res
            .status(400)
            .json({ success: false, message: "error while moving to cart" });
    }
};
