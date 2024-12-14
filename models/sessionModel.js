import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
    role: { type: String, required: true, enum: ["user", "teacher", "admin"] },
    userId: { type: mongoose.Types.ObjectId, required: true },
    email: { type: String, required: true },
    refreshToken: { type: String, required: true },
    createdAt: { type: Date, default: Date.now(), index: { expires: "7d" } },
});

const sessionModel = mongoose.model("session", sessionSchema);
export default sessionModel;
