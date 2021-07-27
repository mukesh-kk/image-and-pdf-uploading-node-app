const express=require("express");
const app=express();
const bodyParser=require("body-parser");
const path = require('path');
const ejs =require("ejs");
const crypto=require("crypto");
var  multer=require("multer");

const mongoose =require("mongoose");
const {GridFsStorage}=require("multer-gridfs-storage");
const methodoverride=require("method-override");
const gridstream=require("gridfs-stream");
//middleware
app.set("view engine","ejs");
app.use(express.static("public"));
app.use(bodyParser.json());
app.use(methodoverride("_method"));

//mongo connection  imageFileData
 const conn= mongoose.createConnection('mongodb+srv://<username:pasword>@cluster0.h1zn0.mongodb.net/imageFileData',{useNewUrlParser:true,useUnifiedTopology:true},(err)=>{
     if(err)console.log("EROOR_conneting to db");
     else console.log("WOW CONNECTED TO SERVER");
 });
//initialsi gridfs for streaming
let gfs;
conn.once("open",()=>{
gfs=gridstream(conn.db,mongoose.mongo);
gfs.collection("uploads");
});
//
const storage = new GridFsStorage({
    db:conn,
    file: (req, file) => {
      return new Promise((resolve, reject) => {
        crypto.randomBytes(16, (err, buf) => {
          if (err) {
            return reject(err);
          }
          const filename = buf.toString('hex') + path.extname(file.originalname);
          const fileInfo = {
            filename: filename,
            bucketName: 'uploads'
          };
          resolve(fileInfo);
        });
      });
    }
  });
  const upload = multer({ storage });

// calling root route
app.get("/",(req,res)=>{
    gfs.files.find().toArray((err,files)=>{
        if(!files||files.length===0){
            res.render("index",{files:false})
        }
        else{
            files.map(file=>{
                if(file.contentType==="image/jpeg"||file.contentType==="image/png"){
                   file.isImage=true;
                }
                else{
                    file.isImage=false;
                }
            })
        } 

        res.render("index",{files:files});
      });

});
// upload post handle
app.post("/upload",upload.single("file"),(req,res)=>{
   // res.json({ file:req.fil});
   res.redirect("/");

});

//get files to show on other page
app.get("/files",(req,res)=>{
   gfs.files.find().toArray((err,files)=>{
     if(!files||files.length===0){
         return res.status(404).json({
             err:"NO files exists"
         });
     }
     return res.json(files);  
   });
});
//geting individual file
app.get("/files/:filename",(req,res)=>{
    gfs.files.findOne({filename:req.params.filename},(err,file)=>{
        if(err){
            console.log("error in finding files///line75 app.js");
            return res.json({
                err:"hahah"
            });
        }
        else{
            return res.json(file);
        }
    })
});
//getting individual image
app.get("/images/:filename",(req,res)=>{
    gfs.files.findOne({filename:req.params.filename},(err,file)=>{
        if(err){
            console.log("error in finding files///line75 app.js");
            return res.json({
                err:"hahah"
            });
        }
        if(file.contentType==="image/jpeg"||file.contentType==="image/png"||file.contentType==="image/webm"){
            const  readstream = gfs.createReadStream(file.filename);
            readstream.pipe(res);
        }
        else{
            res.status(404).json({
                err:"NOIMAGE EXISlIne line-app.js-102"
            })
        }
        
    })
});
app.post("/files/:id",(req,res)=>{
    gfs.remove({_id:req.params.id,root:"uploads"}, function (err, gridStore) {
        if (err) return handleError(err);
        else{
            console.log('success-delted');
            res.redirect("/");
        }
        
      });

});
// process.on('warning', (warning) => {
//     console.log(warning.stack);
// });
//--server--and port heroku
let port=process.env.PORT;
if (port == null || port == "") {
    port = 3000;
  }
app.listen(port,()=>{console.log(`SRVER STARTED On ${port}`);});
