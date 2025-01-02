import mongoose, { HydratedDocument } from "mongoose";
import { ICourse } from "./course.model";

export interface ICart {
    userId: string;
    courses: (HydratedDocument<ICourse> | { _id: string })[]; // Courses can be populated or just ObjectIds
}

const cartSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },
        courses: [{ type: mongoose.Types.ObjectId, ref: "Course" }],
    },
    { timestamps: true }
);

cartSchema.index({ userId: 1 });

const cartModel = mongoose.model("Cart", cartSchema);
export default cartModel;
