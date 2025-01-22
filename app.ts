import express, { NextFunction, Request, Response } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import userRouter from "./routes/userRouter.ts";
import morgan from "morgan";
import { isAuthenticated, authorizedRoles } from "./middlewares/auth.ts";
import teacherRouter from "./routes/teacherRouter.ts";
import adminRouter from "./routes/adminRouter.ts";
import { updateAccessToken } from "./controllers/globalRefresh.ts";
import { googleAuth } from "./controllers/socialAuth.ts";
import courseRouter from "./routes/courseRouter.ts";
import { accessLogStream } from "./utils/HTTPFileloger.ts";
import { logErrorMessage } from "./utils/log.ts";

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(
    cors({
        origin: ["http://localhost:5173"],
        credentials: true,
    })
);

app.use(morgan("dev", { stream: accessLogStream }));

app.get("/test", isAuthenticated, authorizedRoles("admin", "user"), (req, res) => {
    res.status(200).json({ success: true, message: "API is working" });
});

app.get("/api/auth/refresh", updateAccessToken);
app.post("/api/auth/google", googleAuth);
app.use("/api/user", userRouter);
app.use("/api/teacher", teacherRouter);
app.use("/api/admin", adminRouter);
app.use("/api/course", courseRouter);

// global catch for production
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logErrorMessage(`global catch:${err.message}`);
    console.log(err);
    res.status(500).send("something went wrong");
});

export default app;
