
require('dotenv').config()
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const {GridFsStorage} = require("multer-gridfs-storage");
const Grid = require('gridfs-stream');
const cors = require('cors')
const crypto = require('crypto')
const port = process.env.PORT||8000;
const dbURL = process.env.DB_URL;
app.use(express.json());
app.use(cors());

//image handling part
const conn = mongoose.createConnection(dbURL,{useNewUrlParser: true, useUnifiedTopology: true,useFindAndModify:false})
let gfs;
conn.once('open',()=>{
  gfs = Grid(conn.db,mongoose.mongo);
  gfs.collection('images');
})
const storage = new GridFsStorage({
  url:dbURL,
  file:(req,file)=>{
      return new Promise((resolve,reject) =>{
          crypto.randomBytes(16, async(err,buf)=>{

              if(err){
                  return reject(err);
              }
              const filename = buf.toString('hex') + path.extname(file.originalname);
              const fileInfo = {
                  filename:filename,
                  bucketName:'images'
              };
              req.setfilename = filename;
              resolve(fileInfo);
          })
      })
  }
})
const upload = multer({storage})

  app.post("/api/upload", upload.single("file"), (req, res) => {
    console.log(req.setfilename);
    res.status(200).json({"message":"File has been uploaded","filename":req.setfilename});
  });

  app.get('/image/:filename',(req,res)=>{

    gfs.files.findOne({filename:req.params.filename},(err,file)=>{
        if(!file||file.length ===0){
            return res.status(404).json({
                err:'No file exist'
            })
        }
        //check if image
        if(file.contentType ==='image/jpeg'||file.contentType === 'image/png'){
            const readstream = gfs.createReadStream(file.filename);
            readstream.pipe(res)
        } else {
            res.status(404).json({
                error:"not an image"
            });
        }
    })

  })

  //data handling for routes 
  mongoose
  .connect(dbURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify:false
  })
  .then(console.log("Connected to MongoDB"))
  .catch((err) => console.log(err));

  const authRoute = require("./routes/authorization");
  const userRoute = require("./routes/users");
  const postRoute = require("./routes/posts");
  const categoryRoute = require("./routes/categories");

  app.use("/auth", authRoute); 
  app.use("/users", userRoute);
  app.use("/posts", postRoute);
  app.use("/categories", categoryRoute);

app.listen(port, () => {
    console.log("Backend is running.",port);
  });

  