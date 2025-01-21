import mongoose, { Document, Model, Schema } from "mongoose";

interface IVideo extends Document {
    uploadedBy: mongoose.Types.ObjectId;
    courseId: mongoose.Types.ObjectId;
    displayName: string;
    key: string;
    originalFileSize: number;
    originalFileType: number;
    aiStatus: "processing" | "ready" | "failed";
    transcriptId?: string;
    transcodingStatus: "processing" | "ready" | "failed";
    transcodedVideoMasterFileKey?: string;
}

const videoSchema = new mongoose.Schema<IVideo>(
    {
        uploadedBy: {
            type: Schema.Types.ObjectId,
            ref: "Teacher",
            required: true,
        },
        courseId: {
            type: Schema.Types.ObjectId,
            ref: "Course",
            required: true,
        },
        displayName: { type: String, required: true },
        key: {
            type: String,
            required: [true, "video s3 required"],
            unique: true,
            index: true,
        },
        originalFileSize: { type: Number },
        originalFileType: String,

        aiStatus: { type: String, enum: ["processing", "ready", "failed"], default: "processing" },
        transcriptId: { type: String },

        transcodingStatus: {
            type: String,
            enum: ["processing", "ready", "failed"],
            default: "processing",
        },
        transcodedVideoMasterFileKey: { type: String },
    },
    { timestamps: true }
);

const videoModel: Model<IVideo> = mongoose.model("Video", videoSchema);
export default videoModel;
