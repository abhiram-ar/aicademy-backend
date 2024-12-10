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
                    return emailRegex.text(email);
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
        blocked: Boolean,
        
    },
    { timeseries: true }
);

userSchema.pre("save", async function () {
    if (!this.isModified("password")) {
        return next();
    }
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.comparePassword = async function (entredPassword) {
    return await bcrypt.compare(enterdPassword, this.password);
};

const userModel = mongoose.model("User", userSchema);

export default userModel
