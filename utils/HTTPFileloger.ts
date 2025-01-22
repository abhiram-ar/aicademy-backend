import path from "path";
import fs from "fs";
const logDir = path.join(__dirname, "..", "logs");
try {
    fs.accessSync(logDir, fs.constants.F_OK);
} catch (error) {
    fs.mkdirSync(logDir);
}

export const accessLogStream = fs.createWriteStream(path.join(logDir, "access.log"), {
    flags: "a",
});
