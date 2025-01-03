import { Request, Response } from "express";
import { logErrorMessage, logWarning } from "../utils/log";
import cartModel, { ICart } from "../models/cartModel";
import courseModel, { ICourse } from "../models/course.model";

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

        let cartDetails = await cartModel.findOne({ userId }).populate({
            path: "courses",
            select: "title description createdBy level price estimatedPrice thumbnail",
        });

        // if cart does not exist in DB create a new cart,
        // since user is autheicated and authorized, cart is created safely
        if (!cartDetails) {
            cartDetails = await cartModel.create({ userId });
        }

        const totalAmount = cartDetails.courses.reduce(
            (total, current) => {
                const course = current as unknown as ICourse;
                return {
                    totalPrice: total.totalPrice + course.price,
                    estimatedTotal:
                        total.estimatedTotal + course.estimatedPrice,
                };
            },
            { totalPrice: 0, estimatedTotal: 0 }
        );

        console.log(totalAmount);

        console.log("cartDetails", cartDetails);
        return res.status(200).json({
            success: true,
            message: "cart fetch successful",
            length: cartDetails.courses.length,
            cart: cartDetails?.courses,
            cartId: cartDetails._id,
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
            return res
                .status(404)
                .json({ success: false, message: "Invalid courseId" });
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
        return res
            .status(400)
            .json({ success: false, message: "error while adding to cart" });
    }
};

export const removeFromCart = async (
    req: URequest,
    res: Response
): Promise<any> => {
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
