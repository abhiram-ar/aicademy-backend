import { logErrorMessage } from "../utils/log.js";
import teacherModel from "../models/teacherModel.js";

export const onboardingTeacherList = async (req, res) => {
    try {
        const onboardingTeacherList = await teacherModel.find({
            isApproved: "pending",
        }).sort({updatedAt: 1});

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
