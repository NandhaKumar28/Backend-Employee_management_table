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

  // postPeopledbReq: function (req, res) {
  //   //console.log(req)
  //   const password = req.body.password;
  //   bcrypt.hash(password.toString(), salt, (err, hash) => {
  //     if (err) {
  //       console.log(err.message);
  //     }
  //     let details = {
  //       firstName: req.body.firstName,
  //       lastName: req.body.lastName,
  //       email: req.body.email,
  //       hash
  //     };
      
  //     let streamUpload = (req) => {
  //       return new Promise((resolve, reject) => {
  //           let stream = cloudinary.uploader.upload_stream(
  //             (error, result) => {
  //               if (result) {
  //                 resolve(result);
  //               } else {
  //                 reject(error);
  //               }
  //             }
  //           );
  
  //         streamifier.createReadStream(req.file.buffer).pipe(stream);
  //       });
  //   };
  
  //   async function upload(req) {
  //       let result = await streamUpload(req);
  //       console.log(result.secure_url);
  //   }

  //     //  const { error, value } = querySchema.validate(req.body, {
  //     //    abortEarly: false,
  //     //  }); //Validation with JOI

  //     //  if (error) {
        
  //     //    console.log(error.message); 
  //     //    return res.send(error.details);
  //     //  }

  //     let sql = "INSERT INTO Admin (firstName,lastName,email,password) VALUES(?,?,?,?)";
  //     //let sqlSp = "CALL spAddPerson(?,?,?,?,?)";

  //     pool.query(
  //       sql,
  //       [req.body.firstName, req.body.lastName, req.body.email, hash],        
  //       (error) => {
  //         //
  //         if (error) {
  //           res.send({ status: "Failed", message: "Record creation failed" });
  //           console.log(error.message)
  //         } else {
  //           res.send({ status: "Success", message: "Record created successfully" });
  //           console.log(res)
  //         }
  //       }        
  //     );
  //   });
  // },
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
  // putPeopleReq: function (req, res) {
  //   const password = req.body.password;
  //   bcrypt.hash(password.toString(), salt, (err, hash) => {
  //     if (err) {
  //       console.log(err);
  //     }
  //     // const { error, value } = querySchema.validate(req.body, {
  //     //   abortEarly: false,
  //     // });                   //Abort early will see through the complete req body
  //     // if (error) {          //even an error is found in the first line rather than
  //     //                       //breaking the validation as soon as an error is found
  //     //   console.log(error); 
  //     //   return res.send(error.details);
  //     // }

  //     let details = {
  //       firstName: req.body.firstName,
  //       lastName: req.body.lastName,
  //       email: req.body.email,
  //       hash,
  //       ID: req.params.id,
  //     };
  //     //let sql = 'UPDATE Admin SET firstName = ?,lastName = ?,email = ?,password = ?, confirmPassword = ? WHERE id = ?'
  //     let sqlSp = "CALL spUpdatePerson(?,?,?,?,?)";
  //     pool.query(
  //       sqlSp,
  //       [
  //         req.body.firstName,
  //         req.body.lastName,
  //         req.body.email,
  //         hash,
  //         req.params.id,
  //       ],
  //       (err, result) => {
  //         if (err) {
  //           res.send("Error Updating the person");
  //         } else {
  //           res.send({ status: true, message: "Record updated successfully" });
  //         }
  //       }
  //     );
  //   });
  // },
  authUser: function(req,res){
    const email = req.body.email;
    const password = req.body.password;

    const options = {
      expiresIn:"1h"
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
