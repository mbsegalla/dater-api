import { model, Schema } from "mongoose";
import { UserForgotPasswordInterface } from "../../interfaces/userForgotPasswordInterface";
import bcrypt from "bcrypt";

interface UserForgotPasswordModel extends UserForgotPasswordInterface, Document {
  compareOTP(otp: string): Promise<boolean>;
};

const UserForgotPasswordSchema = new Schema<UserForgotPasswordModel>({
  userId: {
    type: String,
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
  },
  passwordVerified: {
    type: Boolean,
    default: false
  }
});

UserForgotPasswordSchema.pre<UserForgotPasswordModel>("save", async function encryptOTP() {
  this.otp = await bcrypt.hash(this.otp, 10);
});

UserForgotPasswordSchema.methods.compareOTP = function (otp: string) {
  return bcrypt.compare(otp, this.otp);
}

export default model<UserForgotPasswordModel>("UserForgotPassword", UserForgotPasswordSchema);