import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { logErrorMessage, logSuccessWithTimestamp, logWithTimestamp } from '../../utils/log';
import path from 'path';
import fs from 'fs';
import s3 from './../../services/aws.S3Client';
import { Readable } from 'stream';

// import * as dotenv from 'dotenv';
// dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

// // cleanup and use s3 from config
// const s3 = new S3Client({
//     region: process.env.AWS_REGION,
//     credentials: {
//         accessKeyId: process.env.AWS_ACCESS_KEY as string,
//         secretAccessKey: process.env.AWS_SECRET_KEY as string,
//     },
// });

export const donwloadFileFromS3 = async (fileKey: string, downloadPath: string) => {
    try {
        const command = new GetObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME as string,
            Key: fileKey,
        });

        logWithTimestamp('downloading file.... ' + path.basename(fileKey));
        const response = await s3.send(command);

        return new Promise((resolve, reject) => {
            const filePath = path.resolve(downloadPath, path.basename(fileKey));
            const fileStream = fs.createWriteStream(filePath);

            if (!response.Body) reject(new Error('no responnse body from AWS'));

            const responseStream = response.Body as Readable;
            responseStream.pipe(fileStream);

            fileStream.on('finish', () => {
                logSuccessWithTimestamp('file downloded successfully');
                resolve(filePath);
            });

            fileStream.on('error', (error) => {
                console.log('error while writing file', error);
                reject(error);
            });
        });
    } catch (error) {
        logErrorMessage('error while downloading from s3');
        logErrorMessage(error.message);
        console.log(error);
    }
};

// test
// donwloadFileFromS3(
//     "6762d2e79e4e6d9d0f66202d/Elon.mp4",
//     path.join(__dirname, "..", "temp", "downloads")
// ).then((res) => console.log("path", res));
