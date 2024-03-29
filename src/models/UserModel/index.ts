import { model, Schema } from "mongoose";
import { UserInterface } from "../../interfaces/UserInterface";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

interface UserModel extends UserInterface, Document {
  comparePasswords(password: string): Promise<boolean>;
  generateToken(): string;
  generateRefreshToken(): string;
  formatDate(date: Date): Date;
};

const UserSchema = new Schema<UserModel>({
  email: {
    type: String,
    required: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  birthDate: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  verified: {
    type: Boolean,
    default: false,
  },
});

UserSchema.pre<UserModel>("save", async function encryptPassword() {
  this.password = await bcrypt.hash(this.password, 8);
});

UserSchema.methods.comparePasswords = function (password: string) {
  return bcrypt.compare(password, this.password);
}

UserSchema.methods.formatDate = function (date) {
  const newDate = new Date(date);
  const formattedDate = `${`0${newDate.getDate() + 1}`.slice(-2)}-${`0${newDate.getMonth() + 1}`.slice(-2)}-${newDate.getFullYear()}`;
  return formattedDate;
}

UserSchema.methods.generateToken = function (): string {
  const decodedToken = {
    _id: this._id,
    email: this.email,
    birthDate: this.formatDate(this.birthDate),
  };

  return jwt.sign(decodedToken, `${process.env.APP_SECRET}`, { expiresIn: '1d' });
}

UserSchema.methods.generateRefreshToken = function (): string {
  const decodedRefreshToken = {
    _id: this._id,
  };

  return jwt.sign(decodedRefreshToken, `${process.env.APP_SECRET_REFRESH}`, { expiresIn: '1d' });
}

export default model<UserModel>('User', UserSchema);