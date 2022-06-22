import { Router } from "express";
import userController from "../../controllers/userController";
import passwordValidationMiddleware from "../../middlewares/passwordValidation";
import UserValidationMiddleware from "../../middlewares/userValidation";

const userRoute: Router = Router();

userRoute.post("/signup", UserValidationMiddleware.userValidation, userController.signup);
userRoute.post("/user-verify", userController.userVerify);
userRoute.post("/signin", userController.signin);
userRoute.post("/forgot-password", userController.forgotPassword);
userRoute.post("/forgot-password-verify", userController.forgotPasswordVerify);
userRoute.post("/reset-password", passwordValidationMiddleware.passwordValidation, userController.resetPassword);

export default userRoute;
