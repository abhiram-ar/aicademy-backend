import mongoose from "mongoose";

const videoSchema = new mongoose.Schema({
    uploadedBy: {
        type: mongoose.Types.ObjectId,
        ref: "Teacher",
        required: true,
    },
    courseId: {
        type: mongoose.Types.ObjectId,
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
});

const videoModel = mongoose.model("Video", videoSchema);
export default videoModel;
