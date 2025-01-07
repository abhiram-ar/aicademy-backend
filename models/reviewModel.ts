import mongoose, { Document, Model, Schema } from "mongoose";

interface IReview extends Document {
    createdBy: mongoose.Types.ObjectId;
    courseId: mongoose.Types.ObjectId;
    review?: string;
    rating: number;
    createdAt: Date;
}

const reviewSchema = new mongoose.Schema<IReview>(
    {
        createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
        courseId: {
            type: Schema.Types.ObjectId,
            ref: "Course",
            required: true,
        },
        review: { type: String },
        rating: { type: Number, required: true },
    },
    { timestamps: true }
);

const reviewModel: Model<IReview> = mongoose.model("Review", reviewSchema);
export default reviewModel;
