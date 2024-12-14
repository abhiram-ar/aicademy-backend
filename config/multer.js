import multer from "multer";

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "/uploads"); // Make sure this folder exists
    },
    filename: (req, file, cb) => {
        cb(
            null,
            `${Date.now()}-${Math.floor(Math.random() * 100)}-${
                file.originalname
            }`
        );
    },
});

export const upload = multer({ storage });
