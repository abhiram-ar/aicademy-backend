import { json, Request, Response } from "express";
import courseModel from "../models/course.model";
import { logErrorMessage, logSuccess, logWarning } from "../utils/log";
import cloudinary from "../config/cloudinary";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import s3, { BUCKET_NAME } from "../services/aws.S3Client";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "node:crypto";
import videoModel from "../models/video.model";
import teacherModel from "../models/teacherModel";
import { createTranscriptAndEmbeddingJob } from "../services/AI_Preprocessing_service/createTranscriptAndEmbeddingJob.publisher";
import fs from "fs";
import { pathToFileURL } from "node:url";
import path from "node:path";

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

export const getCourseDraftList = async (req: TRequest, res: Response): Promise<any> => {
    try {
        const draftList = await courseModel.find(
            {
                createdBy: req.user.teacherId,
            },
            { title: 1, courseState: 1 }
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

export const getCourseDetails = async (req: TRequest, res: Response): Promise<any> => {
    try {
        const { courseId } = req.query;
        if (!courseId) {
            logWarning("courseID not provided");
            return res.status(404).json({ success: false, message: "CourseId not provided" });
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

export const updateBasicDetails = async (req: TRequest, res: Response): Promise<any> => {
    try {
        const {
            courseId,
            title,
            description,
            price,
            estimatedPrice,
            category,
            level,
            benefits,
            prerequisites,
            demoVideoKey,
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
            benefits,
            prerequisites,
            demoVideoKey,
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

export const updateCourseStructure = async (req: TRequest, res: Response): Promise<any> => {
    try {
        const { chapters, courseId } = req.body;
        if (!chapters || !courseId) {
            logErrorMessage(`required fields missing to updating cousrse structure`);
            return res.status(400).json({
                success: false,
                message: "Required fields missing for this request",
            });
        }

        const updateResposne = await courseModel.findOneAndUpdate(
            { _id: courseId, createdBy: req.user.teacherId },
            { chapters: chapters }
        );

        // if invalid if another teacher tries to modify the course data
        if (!updateResposne) {
            logWarning("Requested for course structure update, but no updates in DB");
            return res.status(200).json({ success: false, message: "No updates made in DB" });
        }

        console.log(updateResposne);

        return res.status(200).json({ success: true, message: "course successfuly updated" });
    } catch (error) {
        logErrorMessage("Error while updating course structure");
        logErrorMessage(error.message);
        console.log(error);
        return res.status(200).json({
            success: false,
            message: "Error while updating course structure",
        });
    }
};

export const updateThumbnail = async (req: TRequest, res: Response): Promise<any> => {
    try {
        const teacherId = req.user.teacherId;
        const { courseId, thumbnailPublic_Id, thumbnailS3Key } = req.body;
        const file = req.file;

        if (!courseId) {
            return res.status(400).json({
                success: false,
                message: "courseId missing in request",
            });
        }
        console.log(file);
        const s3Key = path.join("thumbnails", file.filename);
        const fileStream = fs.createReadStream(path.join(__dirname, "..", file.path));
        const command = new PutObjectCommand({
            Key: s3Key,
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            ContentType: file.mimetype,
            Body: fileStream,
        });

        const result = await s3.send(command);
        console.log(result);

        // const uploadResult = await cloudinary.uploader.upload(file.path, {
        //     asset_folder: "thumbnails/",
        //     public_id: thumbnailPublic_Id || undefined,
        //     overwrite: thumbnailPublic_Id ? true : false,
        //     invalidate: thumbnailPublic_Id ? true : false,
        // });

        if (!thumbnailS3Key) {
            logWarning("old thumbaildoes not exist");
            await courseModel.findOneAndUpdate(
                { createdBy: teacherId, _id: courseId },
                {
                    $set: {
                        thumbnail: {
                            s3Key,
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

export const generatePresignedURL = async (req: TRequest, res: Response): Promise<any> => {
    try {
        const { fileName, fileType } = req.body;
        if (!fileName || !fileType) {
            logWarning("missing required fields for generating presigned URL");
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const newKey = `${req.user.teacherId}/${crypto.randomBytes(8).toString("hex")}-${fileName}`;

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
        logErrorMessage(`error while generating presigned url for video upload`);
        logErrorMessage(error.message);
        console.log(error);
        return res.status(400).json({
            success: false,
            message: "error while generating presinged url for video upload",
        });
    }
};

export const saveVideoMetadata = async (req: TRequest, res: Response): Promise<any> => {
    try {
        const { courseId, key, originalFileName, originalFileSize, originalFileType } = req.body;

        if (!(courseId && key && originalFileName && originalFileSize && originalFileType)) {
            logWarning("required fields missing to save video metadata to DB");
            return res.status(400).json({
                success: false,
                message: "Required fields missign in request",
            });
        }

        const result = await videoModel.create({
            uploadedBy: req.user.teacherId,
            displayName: originalFileName,
            courseId,
            key,
            originalFileSize,
            originalFileType,
        });

        if (!result) {
            logErrorMessage("Unable to save video metadata to DB");
            return res
                .status(400)
                .json({ success: false, message: "unable to save video details" });
        }

        console.log("saved video", result);
        // schedule the video to be processed for AI
        await createTranscriptAndEmbeddingJob(result.key, result.id);

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

// securify flaw: Any valid teacher can delete any video in the platform
// fixed: true, check video ownwer ship before deletion
export const deleteVideo = async (req: TRequest, res: Response): Promise<any> => {
    try {
        const { key } = req.body;
        if (!key) {
            logWarning("Video key missing to deleete video from S3");
            return res.status(400).json({
                success: false,
                message: "video key is missing in request",
            });
        }

        const videoDocument = await videoModel.findOne({ key: key });
        if (!videoDocument) {
            logWarning(`attempting to delete video in S3 that does not exitst in DB`);
            return res.status(404).json({
                succes: false,
                message: "Invalid video key or does not exits in DB",
            });
        }

        if (req.user.teacherId !== String(videoDocument.uploadedBy)) {
            logErrorMessage("Teacher is trying to delete video they dont own");
            return res.status(403).json({
                success: false,
                message: "You dont have the aurhority to delete this video",
            });
        }

        const command = new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        });

        const deleteRes = await s3.send(command);
        console.log(deleteRes);

        //remove entry from DB
        await videoDocument.deleteOne();

        return res.status(200).json({ success: true, message: "Video deleted successfully" });
    } catch (error) {
        logErrorMessage("Error while deleting video from S3");
        logErrorMessage(error.message);
        console.log(error);
        return res.status(400).json({
            success: false,
            message: "error while deleting file from s3 or updating DB",
        });
    }
};

export const allCourseVideos = async (req: TRequest, res: Response): Promise<any> => {
    try {
        const { courseId } = req.query;
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

        return res.status(200).json({
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

export const publishCourse = async (req: TRequest, res: Response): Promise<any> => {
    try {
        const { courseId } = req.body;
        if (!courseId) {
            logWarning("courseId missing to update course state");
            return res.status(400).json({
                success: false,
                message: "courseId missing in request",
            });
        }

        await courseModel.findOneAndUpdate(
            { _id: courseId, createdBy: req.user.teacherId },
            {
                courseState: "published",
            }
        );
        return res.status(200).json({ success: true, message: "course published" });
    } catch (error) {
        console.log(error);
        console.log(error.message);
        return res.status(400).json({ success: false, message: "error while publshing course" });
    }
};

export const unPublishCourse = async (req: TRequest, res: Response): Promise<any> => {
    try {
        const { courseId } = req.body;
        if (!courseId) {
            logWarning("courseId missing to update course state");
            return res.status(400).json({
                success: false,
                message: "courseId missing in request",
            });
        }

        await courseModel.findOneAndUpdate(
            { _id: courseId, createdBy: req.user.teacherId },
            { courseState: "draft" }
        );
        return res.status(200).json({ success: true, message: "course unpublished" });
    } catch (error) {
        console.log(error);
        console.log(error.message);
        return res.status(400).json({
            success: false,
            message: "error while unpublshing course",
        });
    }
};
