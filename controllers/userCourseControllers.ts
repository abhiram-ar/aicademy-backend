import { Request, Response, Express } from "express";
import courseModel, { ICourse } from "../models/course.model";
import { logErrorMessage } from "../utils/log";
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

        res.status(200).json({
            success: true,
            message: "courseList successfully fetched",
            length: courses.length,
            courses,
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
