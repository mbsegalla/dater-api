import { model, Schema } from "mongoose";
import { UserOTPVerificationInterface } from "../../interfaces/userOTPVerificationInterface";
import bcrypt from "bcrypt";

interface UserOTPVerificationModel extends UserOTPVerificationInterface, Document { };

const UserOTPVerificationSchema = new Schema({
  userId: {
    type: String,
  },
  otp: {
    type: String,
  },
  createdAt: {
    type: Date,
  },
  expiredAt: {
    type: Date,
  }
});

UserOTPVerificationSchema.pre<UserOTPVerificationModel>("save", async function encryptOTP() {
  this.otp = await bcrypt.hash(this.otp, 10);
});

export default model<UserOTPVerificationModel>("UserOTPVerification", UserOTPVerificationSchema);