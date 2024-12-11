import jwt from "jsonwebtoken";
import { logErrorMessage, logWarning } from "../utils/log.js";

const verifyUser = (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth) {
        logWarning("verifyUser: no authorization data in request");
        return res.status(401).json({
            success: false,
            messsage:
                "No authorization header, please login to access this resource",
        });
    }

    const token = auth.split(" ")[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
        if (error) {
            logWarning("verifyuser: access token expired/Invalid");
            logErrorMessage("->" + error.message);
            return res.status(401).json({
                success: false,
                message: "access token expired/Invalid",
                error: error.message,
            });
        }
        req.user = decoded;
        next();
    });
};

export default verifyUser;
