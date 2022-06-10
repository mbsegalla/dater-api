import { Request, Response, NextFunction } from "express";
import joi from "joi";

class UserValidationMiddleware {
  public userValidation(req: Request, res: Response, next: NextFunction) {
    const userValidate = joi.object().keys({
      name: joi.string().min(3).max(30).regex(/^([^0-9]*)$/).required().messages({
        "string.empty": "Name is required",
        "string.pattern.base": "Name must not contain numbers",
      }),
      email: joi.string().email().required().messages({
        "string.empty": "Email is required",
        "string.email": "Email is invalid",
      }),
      password: joi.string().min(8).max(30).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, 'password').required().messages({
        "string.empty": "Password is required",
        "string.min": "Password length must be at least 8 characters long",
        "string.max": "Password length must be at most 30 characters long",
        "string.pattern.name": "Password must contain at least one lowercase letter, one uppercase letter, one number and one special character",
      }),
      dateOfBirth: joi.date().required().messages({
        "date.empty": "Date of birth is required",
        "date.format": "Date of birth must be in the format DD-MM-YYYY",
        "date.base": "Date of birth must be a valid date",
      }),
    });
    const { error } = userValidate.validate(req.body);
    if (error) {
      return res.status(422).json({ message: error.details[0].message });
    }
    next();
  }
}

export default new UserValidationMiddleware();