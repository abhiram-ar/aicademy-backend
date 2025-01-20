import { IncomingMessage } from "http";
import { logErrorMessage } from "../utils/log";
import jwt from "jsonwebtoken";
import { URL } from "url";

export const authenticateWSClient = async (
    request: IncomingMessage
): Promise<string | undefined> => {
    console.log(request.url);
    const url = new URL(request.url as string, `http://${request.headers.host}`); //chaange to use HTTPs in productions
    const authHeader = url.searchParams.get("authorization");
    console.log(authHeader);

    if (!authHeader) {
        logErrorMessage("ws auth: authication searchparam missing in request");
        return;
    }
    const token = authHeader.split(" ")[1];
    if (!token) logErrorMessage("ws auth: token missing in request");

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string) as {
            userId?: string;
            role: string;
        };
        if (decoded.role !== "user") throw new Error("ws auth: invalid role");

        return decoded.userId;
    } catch (error) {
        logErrorMessage("error while verifying JWT");
        throw error;
    }
};
