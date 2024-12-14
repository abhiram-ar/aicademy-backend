import multer from "multer";

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./temp/uploads"); // Make sure this folder exists
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

// File filter to validate file types
const fileFilter = (req, file, cb) => {

    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true); // Accept the file
    } else {
        cb(new Error("Invalid file type. Only JPEG, PNG, and PDF are allowed"), false);
    }
};

const limits = 10 * 1024 * 1024 //maximum filesize

export const upload = multer({ storage, fileFilter, limits});
