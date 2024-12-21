import { Request, Response } from "express";
import courseModel from "../models/course.model";
import { logErrorMessage } from "../utils/log";

// Extend the Request interface
export interface TRequest extends Request {
    user: {
        teacherId?: string;
        username: string;
        isApproved?: "pending" | "success" | "rejected" | "uninitialized";
    };
}

export const createDraft = async (req: TRequest, res: Response) => {
    try {
        const courseDraft = await courseModel.create({
            createdBy: req.user.teacherId,
            title: req.body.title,
            description: req.body.description,
            courseState: "draft",
        });

        res.status(200).json({
            success: true,
            message: "courseDraft created Sucessfully",
            courseId: courseDraft._id,
        });
    } catch (error) {
        logErrorMessage(`error while creating course draft`);
        logErrorMessage(error.message);
        console.log(error);
        res.status(400).json({
            success: false,
            messsage: "error while creating course draft",
        });
    }
};
