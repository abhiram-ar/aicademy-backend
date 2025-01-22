import { Request, Response } from "express";
import { logErrorMessage } from "../utils/log";
import { URequest } from "./userCartControllers";
import userModel from "../models/userModel";
import courseModel from "../models/course.model";
import mongoose from "mongoose";
import path from "path";

export const getCourseContent = async (req: Request, res: Response): Promise<any> => {
    try {
        const { courseId } = req.params;
        if (!courseId) throw { message: "courseId missing in request", status: 400 };

        const userId = (req as URequest).user.userId;

        const courseBoughtByUser = await userModel.findOne({
            _id: userId,
            coursesBought: courseId,
        });
        if (!courseBoughtByUser) throw { message: "you didnt bought this course", status: 404 };

        const result = await courseModel
            .findById(courseId, {
                title: 1,
                description: 1,
                chapters: 1,
            })
            .populate({ path: "chapters.lessons.videoKey" });

        res.status(200).json({
            success: true,
            message: "course content successfully fetched",
            result,
        });
    } catch (error) {
        logErrorMessage("error while fetching course content");
        logErrorMessage(error.message);
        if (!error.status) {
            console.log(error);
        }
        return res.status(error.status || 400).json({
            success: false,
            message: error.status ? error.message : "error while fetching course details",
        });
    }
};
