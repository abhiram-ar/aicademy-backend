import mongoose, { Document, Model, Schema, Types } from "mongoose";

interface IOrder extends Document {
    userId: mongoose.Types.ObjectId;
    coursesBought: {
        courseId: mongoose.Types.ObjectId;
        soldPrice: number;
        teacherId: mongoose.Types.ObjectId;
        teacherEarning: number;
    };

    coupon: {
        couponApplied: Boolean;
        couponId?: mongoose.Types.ObjectId;
        couponDiscount?: number;
    };

    paymentDetails: {
        razorpayPaymentId: string;
        razorpayOrderId: string;
        razorpaySignature: string;
        razorpayFee: number;
        GST: number;
        receipt?: string;
        notes?: object;
    };

    orderValue: number;
    totalDiscount: number;
    platformFee: number;
}

const orderSchema = new mongoose.Schema<IOrder>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        coursesBought: [
            {
                courseId: {
                    type: Schema.Types.ObjectId,
                    ref: "Course",
                    required: true,
                },
                soldPrice: { type: Number, required: true },
                teacherId: {
                    type: Schema.Types.ObjectId,
                    ref: "Teacher",
                    required: true,
                },
                teacherEarning: { type: Number, required: true },
            },
        ],

        coupon: {
            couponApplied: { type: Boolean, required: true },
            couponId: { type: Schema.Types.ObjectId, ref: "Coupon" },
            couponDiscountAmount: { type: Number },
        },

        paymentDetails: {
            razorpayPaymentId: { type: String, required: true },
            razorpayOrderId: { type: String, required: true },
            razorpaySignature: { type: String, requied: true },
            razorpayFee: { type: Number, required: true },
            GST: { type: Number, required: true },
            receipt: String,
            notes: Object,
        },

        orderValue: { type: Number, required: true },
        totalDiscount: { type: Number, required: true },
        platformFee: { type: Number, required: true },
    },
    { timestamps: true }
);

const orderModel: Model<IOrder> = mongoose.model("Order", orderSchema);
export default orderModel;
