import mongoose, { Document, Model, Schema } from "mongoose";
import { ICourse } from "./course.model";
import { ICoupon } from "./couponModel";

export interface ICart extends Document {
    userId: mongoose.Types.ObjectId;
    courses: Array<mongoose.Types.ObjectId | ICourse>;
    couponApplied: mongoose.Types.ObjectId | ICoupon | null;
    totalAmount: () => { totalPrice: number; estimatedTotal: number };
}

const cartSchema = new mongoose.Schema<ICart>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        courses: [{ type: mongoose.Types.ObjectId, ref: "Course" }],
        couponApplied: { type: mongoose.Types.ObjectId, ref: "Coupon" },
    },
    { timestamps: true }
);

cartSchema.index({ userId: 1 }, { unique: true });

cartSchema.methods.totalAmount = function () {
    return this.courses.reduce(
        (total, current) => {
            const course = current as unknown as ICourse;
            return {
                totalPrice: total.totalPrice + (course.price ?? 0),
                estimatedTotal: total.estimatedTotal + (course.estimatedPrice ?? 0),
            };
        },
        { totalPrice: 0, estimatedTotal: 0 }
    );
};

const cartModel: Model<ICart> = mongoose.model("Cart", cartSchema);
export default cartModel;
