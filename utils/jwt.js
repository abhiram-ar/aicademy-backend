import jwt from "jsonwebtoken";

export const createAccessToken = (payload) => {
    return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "5m" });
};
export const createRefershToken = (payload) => {
    return jwt.sign(payload, process.env.REFERSH_TOKEN_SECRET, { expiresIn: "1h" });
};
