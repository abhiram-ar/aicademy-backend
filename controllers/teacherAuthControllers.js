import teacherModel from "./../models/teacherModel.js";
import { logErrorMessage } from "../utils/log.js";
import { createActivationToken } from "./../utils/jwt.js";
import sendMail from "../utils/sendMail.js";

export const register = async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;
        console.log(firstName, lastName, email, password);
        const isEmailExist = await teacherModel.findOne({ email });
        if (isEmailExist) {
            console.log(false, "teacher email alreay exist");
            return res
                .status(400)
                .json({ success: false, message: "Email alreay exists" });
        }

        const teacher = {
            firstName,
            lastName,
            email,
            password,
        };

        const { activationCode, activationToken } =
            createActivationToken(teacher);

        //data for email verification
        const data = { name: teacher.firstName, activationCode };
        
        try {
            await sendMail({
                email: teacher.email,
                subject: "Activate AIcademy account",
                template: "teacherActivationMail.ejs",
                data,
            });
            return res.status(201).json({
                success: true,
                message: `activation code send to your email ${teacher.email} `,
                activationToken,
            });
        } catch (error) {
            console.log("error while sending male to teacher");
            console.log(error);
            return res.status(500).json({
                success: false,
                message: "cannot send activaion code to email",
            });
        }
    } catch (error) {
        logErrorMessage("error while registering user");
        logErrorMessage(error.message);
        console.log(error);
        res.status(500).json({
            success: false,
            message: "erroe while registering user",
        });
    }
};
