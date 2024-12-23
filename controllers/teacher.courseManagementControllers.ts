import { json, NextFunction, Request, response, Response } from "express";
import { logErrorMessage, logSuccess, logWarning } from "../utils/log";
import courseModel from "../models/course.model";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import s3, { BUCKET_NAME } from "../services/aws.S3Client";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const generatePresignedURL = async (
    req: Request,
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

        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: fileName,
            ContentType: fileType,
        });

        const preSignedURL = await getSignedUrl(s3, command, {
            expiresIn: 3600,
        });
        res.status(200).json({
            success: true,
            message: "preSignedURL generated sucessfully",
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
