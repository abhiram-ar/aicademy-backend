import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors"

const app = express();
app.use(express.json())
app.use(cookieParser())
app.use(cors())

app.get("/test", (req, res)=>{
    res.status(200).json({success: true, message: "API is working"})
})

//todo: global catch for production

export default app;
