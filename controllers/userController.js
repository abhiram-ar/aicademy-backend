import userModel from "./../models/userModel";
import jwt from "jsonwebtoken";

export const registerUser = async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;

        const isEmailExist = await userModel.findOne({ email });
        if (isEmailExist) {
            return res
                .status(400)
                .json({ success: false, message: "Email alreay exists" });
        }

        const user = {
            firstName,
            lastName,
            email,
            password,
        };

        const { activationCode, activationToken } = createActivationToken(user);
    } catch (error) {}
};

export const createActivationToken = (user) => {
    const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
    const tokenPayload = { user, activationCode };
    const activationToken = jwt.sign(
        tokenPayload,
        process.env.ACTIVATION_CODE_SECRET,
        {
            expiresIn: "5m",
        }
    );

    return { activationToken, activationCode };
};
