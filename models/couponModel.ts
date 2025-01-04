import mongoose, { Document, Model } from "mongoose";

export interface ICoupon extends Document {
    code: string;
    description: string;
    isActive: boolean;
    discount: number;
    expiryDate: Date;
    usageLimit: number;
    usedBy: mongoose.Types.ObjectId;
    maxDiscountAmount: number;
    minPurchaseAmount: number;
    validateCoupon: () => boolean | any;
}

const couponSchema = new mongoose.Schema<ICoupon>(
    {
        code: { type: String, required: true, index: true, unique: true },
        description: String,
        isActive: { type: Boolean, default: true },
        discount: { type: Number, required: true },
        expiryDate: { type: Date },
        usageLimit: Number,
        usedBy: [{ type: mongoose.Types.ObjectId, ref: "User" }],
        maxDiscountAmount: Number,
        minPurchaseAmount: Number,
    },
    { timestamps: true }
);

couponSchema.methods.validateCoupon = async function () {
    if (!this.isActive) {
        throw { message: "Coupon is not active anymore", type: "checked" };
    }

    if (this.expiryDate < new Date(Date.now())) {
        throw { message: "Coupon expired", type: "checked" };
    }

    return true;
};

couponSchema.index({ code: 1 });

const couponModel: Model<ICoupon> = mongoose.model("Coupon", couponSchema);
export default couponModel;
