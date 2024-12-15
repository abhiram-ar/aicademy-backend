import mongoose, { plugin } from "mongoose";
import { emailRegex } from "../utils/validators.js";
import bcrypt from "bcrypt";

const teacherSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: [true, "Please enter your first name"],
        },
        lastName: String,
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
            required: [true, "Please entere your password"],
            minLength: [8, "Password must be atleast 8 characters"],
            select: false,
        },
        avatarURL: String,
        role: { type: String, default: "teacher" },
        isVerified: { type: Boolean, default: false },
        coursesCreated: [{ courseId: mongoose.Types.ObjectId }], //todo: add ref Course
        isBlocked: { type: Boolean, default: false },

        isApproved: { type: Boolean, default: false },
        profilePic: {url: String, public_id: String},
        legalName: { type: String },
        legalNameProof: { url: String, public_id: String },
        country: String,

        phoneNo: { type: Number },
        biography: String,

        education: String,
        college: String,
        qualification: String,
        qualificationProof: { url: String, public_id: String },
        remark: { type: String, select: false },
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

const teacherModel = mongoose.model("Teacher", teacherSchema);

export default teacherModel;
