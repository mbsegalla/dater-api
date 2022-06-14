import { Router } from "express";
import userController from "../../controllers/userController";
import UserValidationMiddleware from "../../middlewares/userValidation";

const userRoute: Router = Router();

userRoute.post("/signup", UserValidationMiddleware.userValidation, userController.signup);
userRoute.post("/verify", userController.verifyOTP);
userRoute.post("/signin", userController.signin);

export default userRoute;
