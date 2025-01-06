import mongoose, { Document, Model, Schema } from "mongoose";

export interface IReportSchema extends Document {
    title: string;
    courseId: mongoose.Types.ObjectId;
    description: string;
    createdBy: mongoose.Types.ObjectId;
    status: "pending" | "resolved";
}

const reportSchema = new mongoose.Schema<IReportSchema>({
    title: { type: String, required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    description: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "resolved"], default: "pending" },
});

export const reportModel: Model<IReportSchema> = mongoose.model(
    "Report",
    reportSchema
);
