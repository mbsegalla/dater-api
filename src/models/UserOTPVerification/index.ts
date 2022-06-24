import { model, Schema } from "mongoose";
import { UserOTPVerificationInterface } from "../../interfaces/UserOTPVerification";
import bcrypt from "bcrypt";

interface UserOTPVerificationModel extends UserOTPVerificationInterface, Document {
  compareOTP(otp: string): Promise<boolean>;
};

const UserVerificationSchema = new Schema<UserOTPVerificationModel>({
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
    default: Date.now,
  },
  expiredAt: {
    type: Date,
    default: Date.now,
  }
});

UserVerificationSchema.pre<UserOTPVerificationModel>("save", async function encryptOTP() {
  this.otp = await bcrypt.hash(this.otp, 10);
});

UserVerificationSchema.methods.compareOTP = function (otp: string) {
  return bcrypt.compare(otp, this.otp);
}

export default model<UserOTPVerificationModel>("user-Verification", UserVerificationSchema);