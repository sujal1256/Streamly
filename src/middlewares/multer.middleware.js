import multer from "multer";

const storage = multer.diskStorage({
     destination: function (req, file, cb) {
          cb(null, "./public/temp");
     },
     filename: function (req, file, cb) {
          // here we can create a unique name but it will be there with local server for a very small amount of time
          cb(null, file.originalname);
     },
});

const upload = multer({ storage: storage });

export { upload }; 
