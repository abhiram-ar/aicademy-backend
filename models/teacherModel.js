import mongoose from "mongoose";
import { emailRegex } from "../utils/validators";
import bcrypt from "bcrypt";

const teacherSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: [true, "Please enter your first name"],
        },
        lastName: String,
        LegalName: { type: String, required: true },
        email: {
            type: String,
            required: true,
            unique: true,
            validate: {
                validator: function (email) {
                    return emailRegex.test(email);
                },
                message: "Invalid email",
            },
        },
        password: {
            type: String,
            require: [true, "Please entere your password"],
            minLength: [8, "Password must be atleast 8 characters"],
            select: false,
        },
        avatarURL: String,
        role: { type: String, default: "teacher" },
        isVerified: { type: Boolean, default: false },
        isApproved: { type: Boolean, default: false },
        coursesCreated: [{ courseId: String }],
        isBlocked: { type: Boolean, default: false },

        phoneNo: { type: Number },
        country: String,
        biography: String,

        education: String,
        college: String,
        qualification: String,
        qualificationProof: String,
        remark: String,
    },
    { timestamps: true }
);

teacherSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return next();
    }
    this.password = await bcrypt.hash(this.password, 10);
});

teacherSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const teacherModel = mongoose.model("teacher", teacherSchema);

export default teacherModel;
