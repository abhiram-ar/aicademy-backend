import mongoose, { Schema } from "mongoose";

const courseSchema = new Schema({
    title: { type: String, required: [true, "Course title is required"] },
    description: { type: String, required: [true, "Description is required"] },
    createdBy: {
        type: mongoose.Types.ObjectId,
        ref: "Teacher",
        required: [true, "Teaceher ID is required for coures"],
    },
    courseState: {
        type: String,
        enum: ["draft", "published", "unpublished"],
    },

    price: { type: Number},

    estimatedPrice: { type: Number },
    courseThumbnail: { key: String, public_url: String },
    demoVideos: [{ key: String, public_url: String }],

    rating: Number,
    boughtCount: { type: Number, default: 0 },

    category: String,
    level: { type: String, enum: ["beginner", "intermediate", "advanced"] },

    benifits: [String],
    prerequisites: [String],

    chapters: [
        {
            chapterTitle: {
                type: String,
                required: "chapter title is required",
            },
            lessons: [
                {
                    lessonTitle: String,
                    videoKey: String,
                    videoURL: String,
                    videoDuration: Number,
                },
            ],
        },
    ],
});

const courseModel = mongoose.model("course", courseSchema);
export default courseModel;
