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

    price: { type: Number },

    estimatedPrice: { type: Number },
    thumbnail: { public_id: String, url: String },
    demoVideoKey: String,

    rating: Number,
    boughtCount: { type: Number, default: 0 },

    category: String,
    level: { type: String, enum: ["beginner", "intermediate", "advanced"] },

    benefits: [String],
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

courseSchema.index({ title: "text" });
courseSchema.index({ category: 1 });
courseSchema.index({ price: 1 });

const courseModel = mongoose.model("Course", courseSchema);
export default courseModel;
