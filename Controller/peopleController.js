const fs = require("fs"); //file system
let people = JSON.parse(fs.readFileSync("./data/people.json")); //reading the file system
const Joi = require("joi"); //JOI
const validator = require("express-joi-validation").createValidator({}); //JOI validator
const{getSchema,querySchema,deleteSchema} = require("../validationSchema/apiJoiValidation")

//JOI validation schema for POST and PUT requests
// const querySchema = Joi.object({
//     firstName: Joi.string().required(), //This defines that the input will be a string and it is required
//     lastName:Joi.string().required(),
//     email:Joi.string().email().required(), //This defines that the given input is an email and it is required
//     password:Joi.string().required(),
//     confirmPassword:Joi.string().valid(Joi.ref('password')).required() //This validation schema refers to the prperties of password and checks
//   })                                                                   // if it is the same and it is required

//JOI validation schema for GET request
//  const getSchema = Joi.object({
//    firstName: Joi.string().allow('').optional(), //This schema defines that this paramter can be null and it is optional
//     lastName:Joi.string().allow('').optional(),
//     email:Joi.string().email().allow('').optional(),
//     password:Joi.string().allow('').optional(),
//     confirmPassword:Joi.string().valid(Joi.ref('password')).allow('').optional() //Same as confirmPassword in querySchema but it is optional
//   })

//JOI validation schema for DELETE request
// const deleteSchema = Joi.object({
//     id:Joi.number().integer().required() //Ensures that the given input is an integer and it is not left empty
// })

//Exporting the module so that it can be accessed in get.js
module.exports = {
  //This GET request returns all the people
  getAllPeople: (req, res) => {
    res.status(200).json({
      // status:"Success",
      data: {
        people: people,
      },
    });
  },

  //This GET request returns people by the given parameter
  getPeoplebyParams: (req, res) => {
    const { error, value } = getSchema.validate(req.body); //Validation with JOI
    if (error) {
      console.log(error.details);
      return res.send("Invalid request");
    }
    // console.log(req.query)
    //Defining all the paramteres available
    let id = req.query.id * 1;
    let personId = people.find((el) => el.id === id);

    let firstName = req.query.firstName;
    let personFirstName = people.find((el) => el.firstName === firstName);

    let lastName = req.query.lastName;
    let personLastName = people.find((el) => el.lastName === lastName);

    let email = req.query.email;
    let personEmail = people.find((el) => el.email === email);

    let password = req.query.password;
    let personPassword = people.find((el) => el.password === password);

    let confirmPassword = req.query.confirmPassword;
    let personConfirmPassword = people.find(
      (el) => el.confirmPassword === confirmPassword
    );

    //Checks which parameter is provided
    if (personId) {
      res.send(personId);
    } else if (personFirstName) {
      res.send(personFirstName);
    } else if (personLastName) {
      res.send(personLastName);
    } else if (personEmail) {
      res.send(personEmail);
    } else if (personPassword) {
      res.send(personPassword);
    } else if (personConfirmPassword) {
      res.send(personConfirmPassword);
    } else {
      res.status(404).send("Person not found");
    }
  },

  //POST request
  postPeople: (req, res) => {
    const { error, value } = querySchema.validate(req.body, {
      abortEarly: false,
    }); //Validation with JOI
    if (error) {
      console.log(error);
      return res.send(error.details);
    }

    const newId = people[people.length - 1].id + 1; //Automatically generates id

    const newPerson = Object.assign({ id: newId }, req.body);

    people.push(newPerson);

    fs.writeFile("./data/people.json", JSON.stringify(people), (err) => {
      res.status(201).json({
        //201 means created
        // status:"Success",
        data: {
          person: newPerson,
        },
      });
    });
    // res.send('created')
  },

  //PUT request
  putPeople: (req, res) => {
    const { error, value } = querySchema.validate(req.body, {
      abortEarly: false,
    }); //Abort early will see through the complete req body
    if (error) {
      //even an error is found in the first line rather than
      console.log(error); //breaking the validation as soon as an error is found
      return res.send(error.details);
    }

    // console.log(req.query)

    let id = req.params.id * 1;
    let personToUpdate = people.find((el) => el.id === id); //Finds people with the id provided as input

    if (!personToUpdate) {
      return res.status(404).json({
        //404 means that a server could not find what the client is requesting
        // status:"Fail",
        message: "No person with ID " + id + " is found",
      });
    }

    let index = people.indexOf(personToUpdate);

    people[index] = personToUpdate;

    fs.writeFile("./data/people.json", JSON.stringify(people), (err) => {
      res.status(200).json({
        //200 means success
        // status:"Success",
        data: {
          person: personToUpdate,
        },
      });
    });
  },

  //DELETE request
  deletePeople: (req, res) => {
    const { error, value } = validator.params(deleteSchema);
    if (error) {
      console.log(error);
      return res.send(error.details);
    }
    const id = req.params.id * 1;
    const personToDelete = people.find((el) => el.id === id);

    if (!personToDelete) {
      return res.status(404).json({
        // status:"Delete request failed",
        message: "No person with id " + id + " is not found",
      });
    }

    const index = people.indexOf(personToDelete);

    people.splice(index, 1); //Deleting 1 person using splice

    fs.writeFile("./data/people.json", JSON.stringify(people), (err) => {
      res.status(204).json({
        //204 means no content
        data: {
          message: "Deleted Successfully",
          person: null,
        },
      });
    });
  },
};
