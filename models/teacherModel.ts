import mongoose, { Model, plugin, Types } from "mongoose";
import { emailRegex } from "../utils/validators.ts";
import bcrypt from "bcrypt";
import { ICourse } from "./../models/course.model";

export interface ITeacher extends Document {
    firstName: string;
    lastName?: string;
    email: string;
    googleAuth?: boolean;
    password?: string;
    avatarURL?: string;
    role: string;
    isVerified: boolean;
    coursesCreated: { courseId: Types.ObjectId | ICourse }[];
    isBlocked: boolean;
    isApproved: "pending" | "success" | "rejected" | "uninitialized";
    profilePic?: { url: string; public_id: string };
    legalName?: string;
    legalNameProof?: { url: string; public_id: string };
    country?: string;
    phoneNo?: number;
    biography?: string;
    education?: string;
    college?: string;
    qualification?: string;
    qualificationProof?: { url: string; public_id: string };
    remark?: string;
    comparePassword(enteredPassword: string): Promise<boolean>;

    earnings: number;
    totalAmountCheckedOut: number;

    isBankVerified: Boolean;
    vpa?: string;
}

const teacherSchema = new mongoose.Schema<ITeacher>(
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
        googleAuth: Boolean,
        password: {
            type: String,
            minLength: [8, "Password must be atleast 8 characters"],
            select: false,
        },
        avatarURL: String,
        role: { type: String, default: "teacher" },
        isVerified: { type: Boolean, default: false },
        coursesCreated: [{ courseId: mongoose.Types.ObjectId }], //todo: add ref Course
        isBlocked: { type: Boolean, default: false },

        isApproved: {
            type: String,
            enum: ["pending", "success", "rejected", "uninitialized"],
            default: "uninitialized",
        },
        profilePic: { url: String, public_id: String },
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

        earnings: Number,
        totalAmountCheckedOut: Number,

        isBankVerified: { type: Boolean, default: false },
        vpa: { type: String },
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

const teacherModel: Model<ITeacher> = mongoose.model("Teacher", teacherSchema);

export default teacherModel;
