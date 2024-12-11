import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";

const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;

const userSchema = new Schema(
    {
        firstName: {
            type: String,
            required: [true, "Please enter your first name"],
        },
        lastName: String,
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
        password: {
            type: String,
            required: [true, "Please enter your password"],
            minLength: [6, "Password must be at least 6 characters"],
            select: false,
        },
        avatarURL: String,
        role: { type: String, default: "user" },
        isVerified: { type: Boolean, default: false },
        coursesBought: [{ courseId: String }],
        isBlocked: {type: Boolean, default: false},
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
