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
const { error } = require("console");

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

//POST (With profile pic unique email) 
app.post('/database/post', verifyToken, multer().single('image'), getDatabase.postPeopleReq)

//GET DB Query
app.get("/database/get/", verifyToken, getDatabase.getPeoplebyParams);

//PUT (With profile pic with unique mail) 
app.put('/database/put/:id', verifyToken, multer().single('image'), getDatabase.putPeopleReq)

//DELETE DB Query
app.delete("/database/delete/:id", verifyToken, getDatabase.deletePeopleById);

//GET USER(FOR UPDATE)
app.get("/database/getprofile/:id",verifyToken, getDatabase.getPersonById);

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

//SERVER
app.listen(8081, () => {
  console.log("Server started on port 8081");
});
