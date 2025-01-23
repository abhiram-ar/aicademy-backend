import { Request, Response, Express } from "express";
import courseModel, { ICourse } from "../models/course.model";
import { logErrorMessage, logWarning } from "../utils/log";
import { FilterQuery } from "mongoose";
import { URequest } from "./userCartControllers";
import userModel from "../models/userModel";
import { reportModel } from "../models/userCourseReportModel";
import orderModel from "./../models/orderModel";

export const fetchCourses = async (req: Request, res: Response): Promise<any> => {
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

        const filter: FilterQuery<ICourse> = { courseState: "published" };

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
                  [sortBy as string]: parseInt(sortOrder as string) === -1 ? -1 : 1,
              }
            : { createdAt: 1 };

        console.log(`filter`, filter);

        const courses = await courseModel
            .find(filter)
            .select(
                "title description createdBy level price estimatedPrice thumbnail rating totalRatingCount category"
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

export const fullCourseDetails = async (req: Request, res: Response): Promise<any> => {
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
            .populate({ path: "createdBy", select: "legalName" })
            .populate({
                path: "demoVideoKey",
                select: "transcodedVideoMasterFileKey",
            });

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

export const fetchUserBoughtCourseList = async (req: URequest, res: Response): Promise<any> => {
    try {
        const userdata = await userModel.findById(req.user.userId).populate({
            path: "coursesBought",
            select: "thumbnail title",
            populate: {
                path: "createdBy",
                select: "legalName",
            },
        });

        if (!userdata) {
            logWarning("user does not exits in DB for fetch bought course");
            return res.status(404).json({ success: false, message: "Invalid user" });
        }

        console.log(userdata);
        return res.status(200).json({
            success: false,
            message: "bought course successfully fetched",
            boughtCourseList: userdata.coursesBought,
        });
    } catch (error) {
        logErrorMessage("error while fething user bought cousrs");
        logErrorMessage(error.message);
        console.log(error);
        return res.status(400).json({
            success: false,
            message: "error while fething user bought course list",
        });
    }
};

export const reportACourse = async (req: URequest, res: Response): Promise<any> => {
    console.log("hit");
    try {
        const { courseId, title, description } = req.body;
        if (!courseId || !title || !description) {
            logWarning("required parameter missing in request");
            return res.status(400).json({
                success: false,
                message: "required parameters missing",
            });
        }

        const userDetails = await userModel.findOne(
            {
                _id: req.user.userId,
                coursesBought: { $in: [courseId] },
            },
            { coursesBought: 1 }
        );

        if (!userDetails) {
            logErrorMessage("User cannot report a course they didnt purchased");
            return res.status(403).json({
                success: false,
                message: "cannot report a course you didnt purchase",
            });
        }

        console.log(userDetails);

        await reportModel.create({
            title,
            courseId,
            description,
            createdBy: req.user.userId,
        });

        res.status(201).json({
            success: true,
            message: "report successfully created",
        });
    } catch (error) {
        logErrorMessage("Error while reporting a course");
        logErrorMessage(error.message);
        console.log(error);
        return res.status(400).json({
            success: false,
            messsage: "error while creating a report",
        });
    }
};

export const fetchOrderHistory = async (req: URequest, res: Response): Promise<any> => {
    try {
        const orderHistory = await orderModel
            .find({ userId: req.user.userId })
            .select(
                "coupon coursesBought.courseId coursesBought.soldPrice orderValue totalDiscount createdAt"
            )
            .populate({
                path: "coursesBought.courseId",
                select: "title description createdBy level price estimatedPrice thumbnail rating totalRatingCount",
                populate: { path: "createdBy", select: "legalName firstName" },
            })
            .sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            message: "order histroy successfully fetched ",
            orderHistory,
        });
    } catch (error) {
        logErrorMessage("error while fetching order histroy");
        logErrorMessage(error.message);
        console.log(error);
        res.status(400).json({
            success: false,
            message: "error while fetching order history",
        });
    }
};
