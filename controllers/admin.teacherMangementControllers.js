import { logErrorMessage, logWarning } from "../utils/log.js";
import teacherModel from "../models/teacherModel.js";
import sendMail from "../utils/sendMail.js";

export const onboardingTeacherList = async (req, res) => {
    try {
        const onboardingTeacherList = await teacherModel
            .find({
                isApproved: "pending",
            })
            .sort({ updatedAt: 1 });

        console.log(onboardingTeacherList);

        res.status(200).json({
            success: true,
            message: "onboarding teacher list sucessfully fetched",
            length: onboardingTeacherList.length,
            onboardingTeacherList,
        });
    } catch (error) {
        logErrorMessage("error while fetching onboading teachers list");
        logErrorMessage(error.message);
        console.log(error);
        return res.status(400).json({
            success: false,
            message: "error while fetching onboarding teachers list",
        });
    }
};

export const approveOnboarding = async (req, res) => {
    try {
        const { teacherId } = req.body;
        if (!teacherId) {
            logWarning("teacherId is required for approve onboarding");
            return res
                .status(404)
                .json({ success: false, message: "teacherId not provided" });
        }

        const teacher = await teacherModel.findById(teacherId);

        if (teacher.isApproved === "success") {
            logWarning("teacher is already approved");
            return res.status(200).json({
                success: true,
                message: "teacher is already approved",
            });
        }

        teacher.isApproved = "success";
        await teacher.save();

        try {
            await sendMail({
                email: teacher.email,
                subject: "AIcademy onboarding",
                template: "onboardingApproved.ejs",
                data: { firstName: teacher.firstName },
            });
        } catch (error) {
            logErrorMessage("error while sending onboarding success mail");
            console.log(error);
            teacher.isApproved = "pending";
            await teacher.save();
            return res.status(500).json({
                success: false,
                message: `failed to send onboard success mail to ${teacher.email}`,
            });
        }

        res.status(200).json({
            success: true,
            message: "teacher onboarding successful",
        });
    } catch (error) {
        logErrorMessage("error while approving a teacher for onboarding");
        logErrorMessage(error.message);
        console.log(error);
        return res.status(400).json({
            success: false,
            message: "error while approving the teacher for onboarding",
        });
    }
};

export const rejectOnboarding = async (req, res) => {
    try {
        const { teacherId } = req.body;
        if (!teacherId) {
            logWarning("teacherId is required for reject onboarding");
            return res
                .status(404)
                .json({ success: false, message: "teacherId not provided" });
        }

        const teacher = await teacherModel.findById(teacherId);

        if (teacher.isApproved === "rejected") {
            logWarning("teacher is already rejected");
            return res.status(200).json({
                success: true,
                message: "teacher is already rejected",
            });
        }

        teacher.isApproved = "rejected";
        await teacher.save();

        try {
            await sendMail({
                email: teacher.email,
                subject: "AIcademy onboarding",
                template: "onboardingRejected.ejs",
                data: { firstName: teacher.firstName },
            });
        } catch (error) {
            logErrorMessage("error while sending onboarding rejected mail");
            console.log(error);
            teacher.isApproved = "pending";
            await teacher.save();
            return res.status(500).json({
                success: false,
                message: `failed to send onboard rejected mail to ${teacher.email}`,
            });
        }

        res.status(200).json({
            success: true,
            message: "teacher onboarding rejected sucessfully",
        });
    } catch (error) {
        logErrorMessage("error while rejecting the teacher onboarding");
        logErrorMessage(error.message);
        console.log(error);
        return res.status(400).json({
            success: false,
            message: "error while rejecteing the teacher onboarding",
        });
    }
};