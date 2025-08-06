import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    const uniSuffix = Date.now();
    cb(null, `${file.fieldname}_${uniSuffix}`);
  },
});

export const upload = multer({ storage });
