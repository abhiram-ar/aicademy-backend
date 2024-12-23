import { json, Request, Response } from "express";
import courseModel from "../models/course.model";
import { logErrorMessage, logSuccess, logWarning } from "../utils/log";
import cloudinary from "../config/cloudinary";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import s3, { BUCKET_NAME } from "../services/aws.S3Client";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "node:crypto";
import videoModel from "../models/video.model";

// Extend the Request interface
export interface TRequest extends Request {
    file: any;
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

export const getCourseDraftList = async (
    req: TRequest,
    res: Response
): Promise<any> => {
    try {
        const draftList = await courseModel.find(
            {
                createdBy: req.user.teacherId,
                courseState: "draft",
            },
            { title: 1 }
        );

        console.log(draftList);
        return res.status(200).json(draftList);
    } catch (error) {
        logErrorMessage("error while fetching teacher's draft list");
        logErrorMessage(error.message);
        console.log(error);
        return res.status(400).json({
            success: false,
            message: "error while fething draft course list",
        });
    }
};

export const getCourseDetails = async (
    req: TRequest,
    res: Response
): Promise<any> => {
    try {
        const { courseId } = req.query;
        if (!courseId) {
            logWarning("courseID not provided");
            return res
                .status(404)
                .json({ success: false, message: "CourseId not provided" });
        }

        const courseDetails = await courseModel.findOne({
            createdBy: req.user.teacherId,
            _id: courseId,
        });

        return res.status(200).json({
            success: true,
            messsage: "course details sucessfully fetched",
            courseDetails,
        });
    } catch (error) {
        logErrorMessage("Error while Fetching a course details");
        logErrorMessage(error.message);
        console.log(error);
        return res.status(400).json({
            success: false,
            message: "error while fetching course details",
        });
    }
};

export const updateBasicDetails = async (
    req: TRequest,
    res: Response
): Promise<any> => {
    try {
        const {
            courseId,
            title,
            description,
            price,
            estimatedPrice,
            category,
            level,
        } = req.body;

        if (!courseId) {
            logErrorMessage("No courseId provided to update course details");
            return res.status(400).json({
                success: false,
                message: "No courseId provided in request body",
            });
        }

        await courseModel.findByIdAndUpdate(courseId, {
            title,
            description,
            price,
            estimatedPrice,
            category,
            level,
        });

        res.status(200).json({
            success: true,
            message: "Course details updated sucessfully",
        });
    } catch (error) {
        logErrorMessage("error while updating basic course details");
        logErrorMessage(error.message);
        console.log(error);
        return res.status(400).json({
            success: false,
            message: "Error while updating basic coure details",
        });
    }
};

export const updateThumbnail = async (
    req: TRequest,
    res: Response
): Promise<any> => {
    try {
        const teacherId = req.user.teacherId;
        const { courseId, thumbnailPublic_Id } = req.body;
        const file = req.file;

        if (!courseId) {
            return res.status(400).json({
                success: false,
                message: "courseId missing in request",
            });
        }

        const uploadResult = await cloudinary.uploader.upload(file.path, {
            asset_folder: "thumbnails/",
            public_id: thumbnailPublic_Id || undefined,
            overwrite: thumbnailPublic_Id ? true : false,
            invalidate: thumbnailPublic_Id ? true : false,
        });
        console.log(uploadResult);
        if (!thumbnailPublic_Id) {
            logWarning("old thumbaildoes not exist");
            await courseModel.findOneAndUpdate(
                { createdBy: teacherId, _id: courseId },
                {
                    $set: {
                        thumbnail: {
                            public_id: uploadResult.public_id,
                            url: uploadResult.url,
                        },
                    },
                },
                { runValidators: true }
            );
            logSuccess(`new thumbail details updatedDB`);
        }

        res.status(200).json({
            success: true,
            message: "thumnbail updated successfully",
        });
    } catch (error) {
        logErrorMessage(`error while uploading thumbnail`);
        logErrorMessage(error.message);
        console.log(error);
        return res.status(400).json({
            success: false,
            message: "error while uploading thumnail",
        });
    }
};

export const generatePresignedURL = async (
    req: TRequest,
    res: Response
): Promise<any> => {
    try {
        const { fileName, fileType } = req.body;
        if (!fileName || !fileType) {
            logWarning("missing required fields for generating presigned URL");
            return res
                .status(400)
                .json({ success: false, message: "Missing required fields" });
        }

        const newKey = `${req.user.teacherId}/${crypto
            .randomBytes(8)
            .toString("hex")}-${fileName}`;

        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: newKey,
            ContentType: fileType,
        });

        const preSignedURL = await getSignedUrl(s3, command, {
            expiresIn: 3600,
        });
        res.status(200).json({
            success: true,
            message: "preSignedURL generated sucessfully",
            key: newKey,
            preSignedURL,
        });
    } catch (error) {
        logErrorMessage(
            `error while generating presigned url for video upload`
        );
        logErrorMessage(error.message);
        console.log(error);
        return res.status(400).json({
            success: false,
            message: "error while generating presinged url for video upload",
        });
    }
};

export const saveVideoMetadata = async (
    req: TRequest,
    res: Response
): Promise<any> => {
    try {
        const {
            courseId,
            key,
            originalFileName,
            originalFileSize,
            originalFileType,
        } = req.body;

        if (
            !(
                courseId &&
                key &&
                originalFileName &&
                originalFileSize &&
                originalFileType
            )
        ) {
            logWarning("required fields missing to save video metadata to DB");
            return res.status(400).json({
                success: false,
                message: "Required fields missign in request",
            });
        }

        await videoModel.create({
            uploadedBy: req.user.teacherId,
            displayName: originalFileName,
            courseId,
            key,
            originalFileSize,
            originalFileType,
        });

        return res.status(200).json({
            success: true,
            message: "video metadata saved sucessfully",
        });
    } catch (error) {
        logErrorMessage("error while saving video metadata");
        logErrorMessage(error.message);
        console.log(error);
        return res.status(400).json({
            success: false,
            message: "error while saving video metadata",
        });
    }
};

const allCourseVideos = async (req: TRequest, res: Response): Promise<any> => {
    try {
        const { courseId } = req.body;
        if (!courseId) {
            logWarning("Missing parameter to fetch all course video: coursrId");
            return res.status(400).json({
                success: false,
                message: "courseId is missing in request",
            });
        }

        const courseVideos = await videoModel.find({
            courseId,
            uploadedBy: req.user.teacherId,
        });

        return res
            .status(200)
            .json({
                success: true,
                message: "all course video sucessfully fetched",
                courseVideos,
            });
    } catch (error) {
        logWarning("error while fething all course videos");
        logErrorMessage(error.message);
        console.log(error);
        return res.status(400).json({
            success: false,
            message: "error while fetching all course videos",
        });
    }
};
