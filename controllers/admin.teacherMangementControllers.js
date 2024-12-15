import { logErrorMessage, logWarning } from "../utils/log.js";
import teacherModel from "../models/teacherModel.js";

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

        const teacher = await teacherModel.findById(teacherId)

        if(teacher.isApproved === "success"){
            logWarning("teacher is already approved")
            return res.status(200).json({success: true, message: "teacher is already approved"})
        }

        teacher.isApproved = "success";
        await teacher.save()

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
