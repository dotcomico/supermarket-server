import multer from "multer";
import path from "path";

// 1. Define where and how to save the file
const storage = multer.diskStorage({
  destination: "public/uploads/",
  filename: (req, file, cb) => {
    // Create a unique name: timestamp + original extension
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

// 2. Filter files (only allow images)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error("Only image files are allowed!"));
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter,
});

export default upload;
