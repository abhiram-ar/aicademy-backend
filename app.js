import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import userRouter from "./routes/userRouter.js";
import morgan from "morgan";
import {isAuthenticated, authorizedRoles} from "./middlewares/auth.js";

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors());
app.use(morgan("dev"));

app.get("/test", isAuthenticated, authorizedRoles("admin", "user"), (req, res) => {
    res.status(200).json({ success: true, message: "API is working" });
});

app.use("/api/user", userRouter);

//todo: global catch for production

export default app;
