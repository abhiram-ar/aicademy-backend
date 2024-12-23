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
    key: {
        type: String,
        required: [true, "video s3 required"],
        unique: true,
        index: true,
    },
    originalSize: { type: Number },
});

const videoModel = mongoose.model("Video", videoSchema);
export default videoModel;
