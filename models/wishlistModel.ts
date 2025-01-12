import mongoose, { Document, Model, Schema } from "mongoose";
import { ICourse } from "./course.model";

export interface ICart extends Document {
    userId: mongoose.Types.ObjectId;
    courses: Array<mongoose.Types.ObjectId | ICourse>;
}

const wishlistSchema = new mongoose.Schema<ICart>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },
        courses: [{ type: mongoose.Types.ObjectId, ref: "Course" }],
    },
    { timestamps: true }
);

wishlistSchema.index({ userId: 1 });

const wishlistModel: Model<ICart> = mongoose.model("Wishlist", wishlistSchema);
export default wishlistModel;
