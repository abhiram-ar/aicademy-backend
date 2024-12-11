import jwt from "jsonwebtoken";
import { logErrorMessage, logWarning } from "../utils/log.js";

export const isAuthenticated = (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth) {
        logWarning("isAuthenticated: no authorization data in request");
        return res.status(401).json({
            success: false,
            messsage:
                "No authorization header, please login to access this resource",
        });
    }

    const token = auth.split(" ")[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
        if (error) {
            logWarning("isAuthenticated: access token expired/Invalid");
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

// roles: "user", "admin", "instructor"
export const authorizedRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user?.role || "")) {
            logWarning(`Role: '${req.user?.role}' dont have the permission to access this resource: ${req.url}`)
            return res
                .status(403)
                .json({
                    success: false,
                    message: `Role: '${req.user?.role}' dont have the permission to access this resource`,
                });
        }
        next()
    };
};
