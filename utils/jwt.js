import jwt from "jsonwebtoken";

export const createAccessToken = (payload) => {
    return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1h" });
};
export const createRefershToken = (payload) => {
    return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "1h" });
};

export const createActivationToken = (userCredentials) => {
    const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
    const tokenPayload = { userCredentials, activationCode };
    const activationToken = jwt.sign(
        tokenPayload,
        process.env.ACTIVATION_CODE_SECRET,
        {
            expiresIn: "5m",
        }
    );

    return { activationToken, activationCode };
};