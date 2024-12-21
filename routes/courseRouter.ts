import Express from "express";
import { generatePresignedURL } from "../controllers/teacher.courseManagementControllers";
import {
    createDraft,
    TRequest,
} from "./../controllers/teacher.courseCreationController";
import { authorizedRoles, isAuthenticated } from "../middlewares/auth";

const courseRouter = Express.Router();

courseRouter.post(
    "/create/draft",
    isAuthenticated,
    authorizedRoles("teacher"),
    (req, res) => createDraft(req as TRequest, res) //ts type assertion
);

courseRouter.post("/upload/presignedurl", generatePresignedURL);

export default courseRouter;
