import Express from "express";
import { generatePresignedURL } from "../controllers/teacher.courseManagementControllers";
import {
    createDraft,
    getCourseDetails,
    getCourseDraftList,
    TRequest,
    updateBasicDetails,
    updateThumbnail,
} from "./../controllers/teacher.courseCreationController";
import { authorizedRoles, isAuthenticated } from "../middlewares/auth";
import { upload } from "../middlewares/upload.multer";

const courseRouter = Express.Router();

//protected rotues
courseRouter.use(isAuthenticated, authorizedRoles("teacher"));

courseRouter.post(
    "/create/draft",
    (req, res) => createDraft(req as TRequest, res) //ts type assertion
);

courseRouter.get("/draft-list", (req, res) =>
    getCourseDraftList(req as TRequest, res)
);

courseRouter.patch("/draft/basic-info", (req, res) =>
    updateBasicDetails(req as TRequest, res)
);

courseRouter.get("/full-details", (req, res) =>
    getCourseDetails(req as TRequest, res)
);

courseRouter.patch(
    "/draft/thumbnail",
    upload.single("newThumbnail"),
    (req, res) => updateThumbnail(req as TRequest, res)
);

courseRouter.post("/upload/presignedurl", generatePresignedURL);

export default courseRouter;
