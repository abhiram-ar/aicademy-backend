import mongoose, { Document, Model, Schema } from "mongoose";
import { ITeacher } from "./teacherModel";

interface IPayout extends Document {
    to: mongoose.Types.ObjectId | ITeacher;
    amount: number;
    message: String;
    isApproved: boolean;
    status: "initiated" | "deposited" | "failed";
}

const payoutSchema = new mongoose.Schema<IPayout>(
    {
        to: { type: Schema.Types.ObjectId, ref: "Teacher", required: true },
        amount: { type: Number, required: true, min: 1 },
        message: String,
        isApproved: { type: Boolean, default: false },
        status: {
            type: String,
            required: true,
            enum: ["initiated", "deposited", "failed"],
            default: "initiated",
        },
    },
    { timestamps: true }
);

payoutSchema.index({ to: 1 });

const transactionModel: Model<IPayout> = mongoose.model("Payout", payoutSchema);
export default transactionModel;
