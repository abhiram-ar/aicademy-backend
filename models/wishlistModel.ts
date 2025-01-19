import mongoose, { Document, Model, Schema } from "mongoose";
import { ICourse } from "./course.model";

export interface IWishlist extends Document {
    userId: mongoose.Types.ObjectId;
    courses: Array<mongoose.Types.ObjectId | ICourse>;
}

const wishlistSchema = new mongoose.Schema<IWishlist>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        courses: [{ type: mongoose.Types.ObjectId, ref: "Course" }],
    },
    { timestamps: true }
);

wishlistSchema.index({ userId: 1 }, { unique: true });

const wishlistModel: Model<IWishlist> = mongoose.model("Wishlist", wishlistSchema);
export default wishlistModel;
