import { model, Schema } from "mongoose";
import { UserOTPVerificationInterface } from "../../interfaces/userOTPVerificationInterface";
import bcrypt from "bcrypt";

interface UserOTPVerificationModel extends UserOTPVerificationInterface, Document {
  compareOTP(otp: string): Promise<boolean>;
};

const UserOTPVerificationSchema = new Schema<UserOTPVerificationModel>({
  userId: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
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

UserOTPVerificationSchema.methods.compareOTP = function (otp: string) {
  return bcrypt.compare(otp, this.otp);
}

export default model<UserOTPVerificationModel>("UserOTPVerification", UserOTPVerificationSchema);