import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICourse extends Document {
    title: string;
    description: string;
    createdBy: mongoose.Types.ObjectId;
    courseState?: "draft" | "published" | "unpublished";
    price: number;
    estimatedPrice: number;
    thumbnail?: { public_id?: string; url?: string };
    demoVideoKey?: string;
    rating?: number;
    boughtCount?: number;
    category?: string;
    level?: "beginner" | "intermediate" | "advanced";
    benefits?: string[];
    prerequisites?: string[];
    chapters?: Array<{
        chapterTitle: string;
        lessons?: Array<{
            lessonTitle?: string;
            videoKey?: string;
            videoURL?: string;
            videoDuration?: number;
        }>;
    }>;
}

const courseSchema = new Schema<ICourse>(
    {
        title: { type: String, required: [true, "Course title is required"] },
        description: {
            type: String,
            required: [true, "Description is required"],
        },
        createdBy: {
            type: mongoose.Types.ObjectId as any,
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
    },
    { timestamps: true }
);

courseSchema.index({ title: "text" });
courseSchema.index({ category: 1 });
courseSchema.index({ price: 1 });

const courseModel: Model<ICourse> = mongoose.model("Course", courseSchema);
export default courseModel;
export type courseDocument = ICourse;
