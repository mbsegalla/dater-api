import { model, Schema } from "mongoose";
import { UserInterface } from "../../interfaces/userInterface";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

interface UserModel extends UserInterface, Document {
  comparePasswords(password: string): Promise<boolean>;
  generateToken(): string;
  generateRefreshToken(): string;
  formatDate(date: Date): Date;
};

const UserSchema = new Schema<UserModel>({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  dateOfBirth: {
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
  }
});

UserSchema.pre<UserModel>("save", async function encryptPassword() {
  this.password = await bcrypt.hash(this.password, 8);
});

UserSchema.methods.comparePasswords = function (password: string) {
  return bcrypt.compare(password, this.password);
}

UserSchema.methods.formatDate = function (date) {
  const newDate = new Date(date);
  let formattedDate = `${`0${newDate.getDate() + 1}`.slice(-2)}-${`0${newDate.getMonth() + 1}`.slice(-2)}-${newDate.getFullYear()}`;
  return formattedDate;
}

UserSchema.methods.generateToken = function (): string {
  const decodedToken = {
    _id: this._id,
    name: this.name,
    email: this.email,
    dateOfBirth: this.formatDate(this.dateOfBirth),
  };

  return jwt.sign(decodedToken, `${process.env.APP_SECRET}`, { expiresIn: '1d' });
}

UserSchema.methods.generateRefreshToken = function (): string {
  const userId = {
    _id: this._id,
  };

  return jwt.sign(userId, `${process.env.APP_SECRET_REFRESH}`, { expiresIn: '1d' });
}

export default model<UserModel>('User', UserSchema);