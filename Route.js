const express = require("express");
const app = express();
const cors = require("cors");
const peopleController = require("./Controller/peopleController");
var getDatabase = require("./Model/database");
const bcrypt = require("bcrypt");
const salt = 10;
const jwt = require('jsonwebtoken');
const path = require("path");
const cloudinary = require('cloudinary').v2;
const multer = require('multer')
const dotenv = require('dotenv')
var mysql = require("mysql");
const streamifier = require('streamifier');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.API_SECRET
});

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  })
); 

var pool = mysql.createPool({
  host: "db4free.net",
  user: "react123",
  password: "reactroot",
  database: "peopledatabase",
  connectionLimit: 100,
  multipleStatements: true,
});

const options = {
  overwrite:true,
  invalidate:true,
  resourse_type:"auto"
};

app.use(express.json()); //Middleware

//GET api/v1/people
app.get("/api/v1/people", peopleController.getAllPeople);

// GET '/' parameter
app.get("/", peopleController.getPeoplebyParams);

//POST api/v1/people
app.post("/api/v1/people", peopleController.postPeople);

//PUT
app.put("/api/v1/people/:id", peopleController.putPeople);

//DELETE api/v1/people/:id
app.delete("/api/v1/people/:id", peopleController.deletePeople);

//DB
//GET ALL PEOPLE Database query
app.get("/database", verifyToken, getDatabase.getDatabasereq);

//POST DB Query
//app.post("/database/post", verifyToken,multer().single('image'), getDatabase.postPeopledbReq);

//GET DB Query
app.get("/database/get/", verifyToken, getDatabase.getPeoplebyParams);

//PUT DB Query
app.put("/database/put/:id", verifyToken, getDatabase.putPeopleReq);

//DELETE DB Query
app.delete("/database/delete/:id", verifyToken, getDatabase.deletePeopleById);

//USER login
app.post('/user/login', getDatabase.authUser);

const secret = process.env.ACCESS_TOKEN_SECRET

function verifyToken(req,res,next){
  const token = req.headers['authorization'];
  if(!token){
    return res.status(401).json({message:'Unauthorized access'});
  }
  jwt.verify(token,secret,(err,decoded) => {
    if(err){
      return res.status(401).json({message:"Unauthorized token"});
    }
    req.user = decoded;
    next();
  });
}

//POST (With profile pic) //
app.post('/database/post',verifyToken, multer().single('image'), async(req, res) => {  
  const password = req.body.password;
     bcrypt.hash(password.toString(), salt, async (err, hash) => {
      if (err) {
         console.log(err.message);
       }
  //console.log(res)
  try{
    
    let streamUpload = (req) => {
      return new Promise((resolve, reject) => {
          let stream = cloudinary.uploader.upload_stream(
            (error, result) => {
              if (result) {
                resolve(result);
              } else {
                reject(error);
              }
            }
          );

        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
  };

  // async function upload(req) {
      let result = await streamUpload(req);
      console.log(result.secure_url);
  // }
  
  //  upload(req);
    console.log(req.body.firstName)
    console.log(req.body.lastName)
    console.log(req.body.email)
    console.log(hash)    
    pool.query(      
      'INSERT INTO Admin (firstName, lastName, email, password, image_url) VALUES (?, ?, ?, ?, ?)',
      [req.body.firstName, req.body.lastName, req.body.email, hash, result.secure_url],(err, rows) => {
        if (!err) {
          console.log(rows);
        } else {
          console.log(err);
        }
      }           
    );    
    
    res.status(200).json({ message: 'Form submitted successfully' });
  }
  catch (error){    
    console.log(error)
    res.status(404).json({ message: 'Form submission unsuccessful' });
  }})
})

//SERVER
app.listen(8081, () => {
  console.log("Server started on port 8081");
});