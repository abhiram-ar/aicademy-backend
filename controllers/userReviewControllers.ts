import { Response } from "express";
import reviewModel from "../models/reviewModel";
import { URequest } from "./userCartControllers";
import { logErrorMessage } from "../utils/log";

export const addReviewToCourse = async (
    req: URequest,
    res: Response
): Promise<any> => {
    try {
        const { courseId } = req.body;
        if (!courseId) {
            throw new Error("courseId missing in request");
        }
        res.status(200).json({
            success: true,
            message: "review added to course",
        });
    } catch (error) {
        logErrorMessage("error while addign review to course");
        logErrorMessage(error.message);
        console.log(error);
        return res.status(400).json({ success: false, message: error.message });
    }
};
