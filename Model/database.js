require('dotenv').config()

const express = require("express");
const app = express();
var mysql = require("mysql");
const bodyParser = require("body-parser");
app.use(bodyParser.json());
const {querySchema,getSchema,deleteSchema} = require("../validationSchema/apiJoiValidation");
const validator = require("express-joi-validation").createValidator({}); //JOI validator
const bcrypt = require("bcrypt");
const salt = 10;
const jwt = require('jsonwebtoken');
const multer = require('multer')
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

var pool = mysql.createPool({
  host: "db4free.net",
  user: "react123",
  password: "reactroot",
  database: "peopledatabase",
  connectionLimit: 100,
  multipleStatements: true,
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.API_SECRET
});

module.exports = {
  pool: pool,
  getDatabasereq: function (req, res) {
    //let sql = "SELECT * FROM Admin";
    let sqlSp = "call peopledatabase.spGetAllPerson();";
    pool.query(sqlSp, function (error, result) {
      if (error) {
        res.send(error);
      } else {
        res.send(result[0]);
      }
    });
  },

   putPeopleReq: async (req, res) => {
    const email = req.body.email;
  
    // Query the database to check if the email already exists
    pool.query('SELECT id, firstName FROM Admin WHERE email = ?', [email], async (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Internal Server Error' });
      }
  
      if (result.length > 0 && result[0].id != req.params.id) {
        return res.send({ message: 'Email already exists' });
        console.log(res)
      }
  
      try {
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
  
        let result = await streamUpload(req);
  
        pool.query(
          'UPDATE Admin SET firstName = ?,lastName = ?,email = ?, image_url = ? WHERE id = ?',
          [req.body.firstName, req.body.lastName, email, result.secure_url, req.params.id],
          (err, rows) => {
            if (err) {
              console.error(err);
              return res.status(500).json({ message: 'Internal Server Error' });
            }
  
            console.log(rows);
            res.status(200).json({ message: 'Form Updated successfully' });
          }
        );
      } catch (error) {
        console.error(error);
        res.status(404).json({ message: 'Form updation unsuccessful' });
      }
    });
  },

  getPeoplebyParams: function (req, res) {
    let details = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: req.body.password,
    };

    const { error, value } = getSchema.validate(req.body); //Validation with JOI
    if (error) {
      console.log(error.details);
      return res.send("Invalid request");
    }
    //let sql = 'SELECT * FROM Admin WHERE ID= ? || firstName=? || lastName=? || email=? || password=? || confirmPassword = ?'
    let sqlSp = "CALL spGetPersonByParameter(?,?,?,?,?)";
    pool.query(
      sqlSp,
      [
        req.query.id,
        req.query.firstName,
        req.query.lastName,
        req.query.email,
        req.query.password,
      ],
      (err, rows) => {
        if (!err) {
          res.send(rows);
        } else {
          console.log(err);
        }
      }
    );
  },
  deletePeopleById: function (req, res) {
    const { error, value } = validator.params(deleteSchema);
    if (error) {
      console.log(error);
      return res.send(error.details);
    }
    //let sql = 'DELETE FROM Admin WHERE ID=?'
    let sqlSp = "CALL `spDeletePersonbyId`(?)";
    pool.query(sqlSp, [req.params.id], (err, rows) => {
      if (!err) {
        res.send(`Person with ID ${req.params.id} has been deleted`);
      } else {
        console.log(err);
      }
    });
  },
   postPeopleReq: async (req, res) => {
    const email = req.body.email;
  
    // Query the database to check if the email already exists
    pool.query('SELECT firstName FROM Admin WHERE email = ?', [email], async (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Internal Server Error' });
      }
  
      if (result.length > 0) {
        return res.send({ message: 'Email already exists' });
        res.send({message:"Email already exists"})
      }
  
      const password = req.body.password;
  
      bcrypt.hash(password.toString(), salt, async (err, hash) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: 'Internal Server Error' });
        }
  
        try {
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
  
          let result = await streamUpload(req);
  
          pool.query(
            'INSERT INTO Admin (firstName, lastName, email, password, image_url) VALUES (?, ?, ?, ?, ?)',
            [req.body.firstName, req.body.lastName, email, hash, result.secure_url],
            (err, rows) => {
              if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Internal Server Error' });
              }
  
              console.log(rows);
              res.status(200).json({ message: 'Form submitted successfully' });
            }
          );
        } catch (error) {
          console.error(error);
          res.send({ message: 'Form submission unsuccessful' });
        }
      });
    });
  },
  
  
  authUser: function(req,res){
    const email = req.body.email;
    const password = req.body.password;

    const options = {
      expiresIn:"10h"
    }
    
    let sql = "SELECT * FROM Admin WHERE email = ?"

    pool.query(
      sql,
      [email],
      (err,result) =>{        
        if(err){
          res.send({err:err});          
        }
        if(result.length > 0){
          bcrypt.compare(password,result[0].password,(error,response) => {
            if(response){
              const token = jwt.sign({email:email},process.env.ACCESS_TOKEN_SECRET,options) //Creates a JWT token              
              res.send({status:"Success",token:token,user:result})  //Sends the token and user details in response   
                       
            } else{
                res.send({status:"Failed",message:"User name and password do not match"})                
            }
          })
        }else{
          res.send({message:"User doesn't exist"})
        }
      }
    )
  },
  getPersonById: function(req,res){
    const id = req.params.id;

    let sql = 'SELECT * FROM Admin WHERE ID = ?'
    pool.query(
      sql,
      [id],
      (err,result) => {
        if(err){
          res.send(err)
        }else{
          res.send(result[0])
        }
      }
    )
  }
};
