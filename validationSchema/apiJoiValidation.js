const Joi = require("joi"); //JOI
const validator = require("express-joi-validation").createValidator({}); //JOI validator

//JOI validation schema for DELETE request
const deleteSchema = Joi.object({
  id: Joi.number().integer().required(), //Ensures that the given input is an integer and it is not left empty
});

//JOI validation for GET request
const getSchema = Joi.object({
  id: Joi.number().integer().allow("").optional(),
  firstName: Joi.string().allow("").optional(), //This schema defines that this paramter can be null and it is optional
  lastName: Joi.string().allow("").optional(),
  email: Joi.string().email().allow("").optional(),
  password: Joi.string().allow("").optional(),
  confirmPassword: Joi.string().valid(Joi.ref("password")).allow("").optional(), //Same as confirmPassword in querySchema but it is optional
});

//JOI validation for POST and PUT request
const querySchema = Joi.object({
  id: Joi.number().integer().allow("").optional(),
  firstName: Joi.string().required(), //This defines that the input will be a string and it is required
  lastName: Joi.string().required(),
  email: Joi.string().email().required(), //This defines that the given input is an email and it is required
  password: Joi.string().required(),
  confirmPassword: Joi.string().valid(Joi.ref("password")).allow("").optional(), //This validation schema refers to the prperties of password and checks
});

module.exports = {deleteSchema,getSchema,querySchema};
