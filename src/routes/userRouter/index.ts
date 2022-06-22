import { Router } from "express";
import userController from "../../controllers/userController";
import passwordValidationMiddleware from "../../middlewares/passwordValidation";
import UserValidationMiddleware from "../../middlewares/userValidation";

const userRoute: Router = Router();

userRoute.post("/signup", UserValidationMiddleware.userValidation, userController.signup);
userRoute.post("/user-verify", userController.verifyOTP);
userRoute.post("/signin", userController.signin);
userRoute.post("/forgot-password", userController.sendEmailforgotPassword);
userRoute.post("/forgot-password-verify", userController.verifyForgotPasswordOTP);
userRoute.post("/reset-password", passwordValidationMiddleware.passwordValidation, userController.resetPassword);

export default userRoute;
