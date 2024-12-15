import adminModel from "../models/adminModel.js";
import { logErrorMessage } from "../utils/log.js";
export const register = async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;

        const isEmailExist = await adminModel.findOne({ email });
        if (isEmailExist) {
            console.log(false, "admin email alreay exist");
            return res
                .status(400)
                .json({ success: false, message: "Email already exists" });
        }

        await adminModel.create({
            firstName,
            lastName,
            email,
            password,
        });

        return res.status(201).json({
            success: true,
            message: "admin account created",
        });
    } catch (error) {
        logErrorMessage("error while registering user");
        logErrorMessage(error.message);
        console.log(error);
        res.status(500).json({
            success: false,
            message: "error while registering user",
            errorMessage: error.message
        });
    }
};
