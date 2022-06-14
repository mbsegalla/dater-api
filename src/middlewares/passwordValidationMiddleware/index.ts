import { Request, Response, NextFunction } from "express";
import joi from "joi";

class PasswordValidationMiddleware {
  public passwordValidation(req: Request, res: Response, next: NextFunction) {
    const passwordValidate = joi.object().keys({
      password: joi.string().min(8).max(30).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, 'password').required().messages({
        "string.empty": "Password is required",
        "string.min": "Password length must be at least 8 characters long",
        "string.max": "Password length must be at most 30 characters long",
        "string.pattern.name": "Password must contain at least one lowercase letter, one uppercase letter, one number and one special character",
      })
    });
    const { error } = passwordValidate.validate(req.body);
    if (error) {
      return res.status(422).json({ message: error.details[0].message });
    }
    next();
  }
}

export default new PasswordValidationMiddleware();