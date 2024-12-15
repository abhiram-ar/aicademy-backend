import mongoose from "mongoose";
import { emailRegex } from "../utils/validators";
import bcrypt from "bcrypt";


const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS) || 10

const adminSchema = new mongoose.Schema(
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
                message: "Invalid Email",
            },
        },
        password: {
            type: String,
            required: [true, "Please enter your password"],
            minLength: [10, "Password must be at least 10 characters long"],
            select: false,
        },
        avatarURL: String,
        role: { type: String, default: "admin" },
        lastLogin: { type: Date },
    },
    { timestamps: true }
);

adminSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return next();
    }
    this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
});

adminSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const adminModel = mongoose.model("admin", adminSchema);
export default adminModel;
