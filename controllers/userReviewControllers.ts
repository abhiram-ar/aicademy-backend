import { Response } from "express";
import reviewModel from "../models/reviewModel";
import { URequest } from "./userCartControllers";
import { logErrorMessage } from "../utils/log";
import userModel from "../models/userModel";

export const addReviewToCourse = async (
    req: URequest,
    res: Response
): Promise<any> => {
    try {
        const { courseId, rating, review } = req.body;
        if (!courseId || !rating) {
            throw {
                message: "required paramter missing in request",
                status: 400,
            };
        }

        if (rating < 0 || rating > 5) {
            throw { message: "Rating should be in range 0-5", status: 400 };
        }

        // check if user had purchased the course
        const userDetails = await userModel.findOne(
            {
                _id: req.user.userId,
                coursesBought: { $in: [courseId] },
            },
            { _id: 1 }
        );
        if (!userDetails) {
            throw {
                message: "cannot add review to course user didnt buy",
                status: 403,
            };
        }

        await reviewModel.create({
            createdBy: req.user.userId,
            courseId: courseId,
            rating: rating,
            review: review,
        });

        return res.status(200).json({
            success: true,
            message: "review added to course",
        });
    } catch (error) {
        logErrorMessage("error while addign review to course");
        logErrorMessage(error.message);
        if (!error.status) {
            console.log(error);
        }
        return res.status(error.status || 400).json({
            success: false,
            message: error.status ? error.message : "error while adding review",
        });
    }
};

export const editReview = async (
    req: URequest,
    res: Response
): Promise<any> => {
    try {
        const { reviewId, rating, review } = req.body;
        if (!reviewId) {
            throw {
                message: "reviewId paramter missing in request",
                status: 400,
            };
        }

        if ((rating && rating < 0) || rating > 5) {
            throw { message: "Rating should be in range 0-5", status: 400 };
        }

        // check if user had purchased the course
        const reviewDetails = await reviewModel.findOne({
            _id: reviewId,
            createdBy: req.user.userId,
        });
        if (!reviewDetails) {
            throw {
                message: "Invalid ReviewId",
                status: 400,
            };
        }

        await reviewModel.updateOne({
            rating: rating,
            review: review,
        });

        return res.status(200).json({
            success: true,
            message: "review updated successfully",
        });
    } catch (error) {
        logErrorMessage("error while editing review");
        logErrorMessage(error.message);
        if (!error.status) {
            console.log(error);
        }
        return res.status(error.status || 400).json({
            success: false,
            message: error.status
                ? error.message
                : "error while updating review",
        });
    }
};
