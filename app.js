import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import userRouter from "./routes/userRouter.js";
import morgan from "morgan";
import { isAuthenticated, authorizedRoles } from "./middlewares/auth.js";
import teacherRouter from "./routes/teacherRouter.js";
import adminRouter from "./routes/adminRouter.js";
import { updateAccessToken } from "./controllers/globalRefresh.js";
import { googleAuth } from "./controllers/socialAuth.js";

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(
    cors({
        origin: ["http://localhost:5173"],
        credentials: true,
    })
);
app.use(morgan("dev"));

app.get(
    "/test",
    isAuthenticated,
    authorizedRoles("admin", "user"),
    (req, res) => {
        res.status(200).json({ success: true, message: "API is working" });
    }
);

app.get("/api/auth/refresh", updateAccessToken);
app.post("/api/auth/google", googleAuth)
app.use("/api/user", userRouter);
app.use("/api/teacher", teacherRouter);
app.use("/api/admin", adminRouter);

//todo: global catch for production

export default app;
