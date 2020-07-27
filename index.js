const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const mongoose = require("mongoose");
const multer = require("multer");
const cors = require("cors");
const GridFsStorage = require("multer-gridfs-storage");
const Grid = require("gridfs-stream");
const crypto = require("crypto");

const app = express();

app.use(bodyParser.json());
app.use(cors());

//Connect to DB
//mongodb+srv://nasir:nasir@cluster0-17xdy.mongodb.net/test?retryWrites=true&w=majority
// const mongoURI = "mongodb+srv://nasir:nasir@cluster0-17xdy.mongodb.net/test?retryWrites=true&w=majority";
const mongoURI = "mongodb+srv://abdullah:abcd123456@cluster0-9ml1p.mongodb.net/test?retryWrites=true&w=majority"

const conn = mongoose.createConnection(mongoURI);

mongoose.connect(mongoURI, { useNewUrlParser: true });

let gfs;

conn.once("open", () => {
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection("image");
  console.log("Connection Successful");
});

// Create storage engine
const storage = new GridFsStorage({
  url: mongoURI,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = file.originalname;
        const fileInfo = {
          filename: Date.now() + "_" + filename,
          bucketName: "image"
        };
        resolve(fileInfo);
      });
    });
  }
});

const upload = multer({ storage });
// var upload = multer({ storage: storage }).array('imgs', 6);

app.get('/demo', (req, res) => {
  res.send("Working")
})
app.post("/", upload.single("img"), (req, res, err) => {
  console.log(req.body, req.files, "FILESSS")
  res.send(req.files);

});
// app.post("/", upload.array("imgs", 6), (req, res, err) => {
//   // console.log(req.body)
//   // res.send(req.files);
//   // if (err) {
//   //   console.log(err, "errerrerrerrerrerr")
//   //   return res.end("Error uploading file.");
//   //   // res.status(400).json({ err: err, message: "ERRRRRRRRR" })

//   // }
//   // res.end("File is uploaded");
//   res.status(200).json({ message: "File is uploaded" })

// });

app.get("/:filename", (req, res) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    // Check if file
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: "No file exists"
      });
    }

    // Check if image
    if (file.contentType === "image/jpeg" || file.contentType === "image/png") {
      // Read output to browser
      const readstream = gfs.createReadStream(file.filename);
      readstream.pipe(res);
    } else {
      res.status(404).json({
        err: "Not an image"
      });
    }
  });
});

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Server started on port ${port}`));
