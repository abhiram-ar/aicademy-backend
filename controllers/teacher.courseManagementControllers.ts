import { json, NextFunction, Request, Response } from "express";
import { logErrorMessage, logSuccess, logWarning } from "../utils/log";
import courseModel from "../models/couse.model";

export const createCourse = async (
    req: Request,
    res: Response
): Promise<any> => {
    try {
        const data = req.body;

        await courseModel.create(data);

        res.status(200).json({
            success: true,
            message: "course created sucecssfully",
        });
    } catch (error) {
        logErrorMessage("error while creating a course");
        logErrorMessage(error.message);
        console.log(error);
        return res.status(400).json({
            success: false,
            message: "error while creating the course",
        });
    }
};

export const editCourse = async (req: Request, res: Response): Promise<any> => {
    try {
        const { courseId, data } = req.body;
        const course = courseModel.findById(courseId);

        if (!course) {
            logWarning("Unable to find the course to edit");
            return res
                .status(400)
                .json({ success: false, message: "Invalid course" });
        }
    } catch (error) {
        logErrorMessage(`error while editing the course`);
        logErrorMessage(error.message);
        console.log(error);
        return res.status(400).json({
            success: false,
            message: "Unexpected error while editing the course",
        });
    }
};
