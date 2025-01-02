import { Request, Response, Express } from "express";
import courseModel, { ICourse } from "../models/course.model";
import { logErrorMessage, logWarning } from "../utils/log";
import { Aggregate, FilterQuery, SortOrder } from "mongoose";

export const fetchCourses = async (
    req: Request,
    res: Response
): Promise<any> => {
    try {
        // todo: add logic for rating: sortby
        const {
            search,
            category,
            level,
            minPrice,
            maxPrice,
            sortBy,
            sortOrder = -1,
            page = 1,
            limit = 5,
        } = req.query;

        const filter: FilterQuery<ICourse> = {};

        if (search) {
            filter.title = { $regex: search as string, $options: "i" };
        }

        if (category) {
            filter.category = category;
        }

        if (level) {
            filter.level = level;
        }

        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = parseFloat(minPrice as string);
            if (maxPrice) filter.price.$lte = parseFloat(maxPrice as string);
        }

        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

        const sortOption: Record<string, -1 | 1> = sortBy
            ? {
                  [sortBy as string]:
                      parseInt(sortOrder as string) === -1 ? -1 : 1,
              }
            : { createdAt: 1 };

        console.log(`filter`, filter);

        const courses = await courseModel
            .find(filter)
            .select(
                "title description createdBy level price estimatedPrice thumbnail"
            )
            .populate({
                path: "createdBy",
                select: "firstName lastName legalName ",
            })
            .sort(sortOption)
            .skip(skip)
            .limit(parseInt(limit as string));

        const total = await courseModel.countDocuments(filter);

        res.status(200).json({
            success: true,
            message: "courseList successfully fetched",
            length: courses.length,
            courses,
            pages: Math.ceil(total / parseInt(limit as string)),
        });
    } catch (error) {
        logErrorMessage("Error while fetching courses for explore page");
        logErrorMessage(error.message);
        console.log(error);
        return res.status(400).json({
            success: false,
            message: "error while fetching explore page course list",
        });
    }
};

export const fullCourseDetails = async (
    req: Request,
    res: Response
): Promise<any> => {
    try {
        const { courseId } = req.query;
        console.log(courseId);

        if (!courseId) {
            logWarning("courseId missing in the request");
            return res.status(400).json({
                success: false,
                message: "courseId is misssing in the request",
            });
        }

        const courseDetails = await courseModel
            .findOne({ _id: courseId }, { "chapters.lessons.videoKey": 0 })
            .populate({ path: "createdBy", select: "legalName" });

        if (!courseDetails) {
            logWarning("no course found wit id:" + courseId);
            return res.status(404).json({
                success: false,
                message: "no course found for id: " + courseId,
            });
        }

        return res.status(200).json({
            success: true,
            message: "full course details fetched successfyllt",
            fullCourseData: courseDetails,
        });
    } catch (error) {
        logErrorMessage("Error while fetching fullc course Details");
        logErrorMessage(error.message);
        return res.status(400).json({
            success: false,
            message: "Error while fethching full course details",
        });
    }
};
