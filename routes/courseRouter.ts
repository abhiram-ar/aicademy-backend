import Express from "express";
import {
    allCourseVideos,
    deleteVideo,
    generatePresignedURL,
    saveVideoMetadata,
    updateCourseStructure,
} from "../controllers/teacher.courseCreationController";
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

courseRouter.patch("/draft/structure", (req, res) =>
    updateCourseStructure(req as TRequest, res)
);

courseRouter.get("/full-details", (req, res) =>
    getCourseDetails(req as TRequest, res)
);

courseRouter.patch(
    "/draft/thumbnail",
    upload.single("newThumbnail"),
    (req, res) => updateThumbnail(req as TRequest, res)
);

courseRouter.get("/draft/videos", (req, res) =>
    allCourseVideos(req as TRequest, res)
);

courseRouter.delete("/draft/video", (req, res) =>
    deleteVideo(req as TRequest, res)
);

courseRouter.post("/upload/presignedurl", (req, res) =>
    generatePresignedURL(req as TRequest, res)
);

courseRouter.post("/upload/save-metadata", (req, res) =>
    saveVideoMetadata(req as TRequest, res)
);

export default courseRouter;
