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
    validateCoupon: () => { success: boolean; error?: object };
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

couponSchema.methods.validateCoupon = function () {
    if (!this.isActive) {
        return {
            success: false,
            error: { message: "Coupon is not active anymore", type: "checked" },
        };
    }

    if (this.expiryDate < new Date(Date.now())) {
        return {
            success: false,
            error: { message: "Coupon expired", type: "checked" },
        };
    }
    if (this.usedBy && this.usageLimit < this.usedBy.length) {
        return {
            success: false,
            error: { message: "Max usage reached", type: "checked" },
        };
    }

    return { success: true };
};

couponSchema.index({ code: 1 });

const couponModel: Model<ICoupon> = mongoose.model("Coupon", couponSchema);
export default couponModel;
