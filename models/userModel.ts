import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import { emailRegex } from "../utils/validators.ts";

interface IUser extends Document {
    firstName: string;
    lastName?: string;
    profilePicture: { url: string; public_id: string };
    email: string;
    googleAuth?: boolean;
    password?: string;
    avatarURL?: string;
    role: string;
    isVerified: boolean;
    coursesBought: { courseId: string }[];
    isBlocked: boolean;
    comparePassword(enteredPassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
    {
        firstName: {
            type: String,
            required: [true, "Please enter your first name"],
        },
        lastName: String,
        profilePicture: { url: { type: String }, public_id: { type: String } },
        email: {
            type: String,
            required: [true, "Please enter your email"],
            validate: {
                validator: function (email) {
                    return emailRegex.test(email);
                },
                message: "Invalid email",
            },
            unique: true,
        },
        googleAuth: Boolean,
        avatarURL: String,
        password: {
            type: String,
            minLength: [8, "Password must be at least 8 characters"],
            select: false,
        },
        role: { type: String, default: "user" },
        isVerified: { type: Boolean, default: false },
        coursesBought: [{ courseId: String }],
        isBlocked: { type: Boolean, default: false },
    },
    { timestamps: true }
);

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return next();
    }
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const userModel = mongoose.model("User", userSchema);

export default userModel;
