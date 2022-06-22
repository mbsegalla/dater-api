import { Request, Response } from "express";
import mail from "../../services/mail";
import userModel from "../../models/userModel";
import userOTPVerificationModel from "../../models/userOTPVerification";
import userForgotPasswordModel from "../../models/userForgotPassword";
import path from "path";
import bcrypt from "bcrypt";
import "dotenv/config";

class UserController {
  public async signup(req: Request, res: Response) {
    const { email, dateOfBirth } = req.body;

    try {
      const userExists = await userModel.findOne({ email });
      if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const today = new Date();
      const birthDate = new Date(dateOfBirth);
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthToBeLegalAge = today.getMonth() - birthDate.getMonth();
      if (age < 18 || (monthToBeLegalAge === 0)) {
        return res.status(400).json({ message: 'User must be 18 years old or older' });
      }

      const newUser = await userModel.create(req.body);

      const data = {
        message: 'User registered successfully',
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        dateOfBirth: newUser.formatDate(newUser.dateOfBirth),
        createdAt: newUser.formatDate(newUser.createdAt),
        verified: newUser.verified,
      };

      const otp = `${Math.floor(100000 + Math.random() * 900000)}`;
      const timeToExpire = 1;

      await userOTPVerificationModel.create({
        userId: newUser._id,
        otp: otp,
        createdAt: new Date(),
        expiredAt: new Date(new Date().getTime() + (timeToExpire * 60000)),
      });

      mail.to = newUser.email;
      mail.subject = 'Confirmação de cadastro';
      mail.partialsDir = path.resolve('./src/emailTemplates/userConfirmation');
      mail.layoutsDir = path.resolve('./src/emailTemplates/userConfirmation');
      mail.defaultLayout = "";
      mail.viewPath = path.resolve('./src/emailTemplates/userConfirmation');
      mail.context = {
        name: data.name,
        otp
      }

      const result = mail.sendMail();

      return res.status(201).json({ data, result });

    } catch (err) {
      res.status(422).json({ message: 'There are invalid fields!' });
    }
  }

  public async userVerify(req: Request, res: Response) {
    const { userId, otp } = req.body;

    try {
      if (!userId || !otp) {
        return res.status(400).json({ message: 'Invalid request!' });
      }

      const userOTPVerification = await userOTPVerificationModel.findOne({ userId });
      if (!userOTPVerification) {
        return res.status(400).json({ message: 'User not found!' });
      }

      const { expiredAt } = userOTPVerification;
      if (expiredAt < new Date()) {
        await userOTPVerificationModel.deleteMany({ userId });
        return res.status(400).json({ message: 'OTP has expired!' });
      }

      const validOTP = await userOTPVerification.compareOTP(otp);
      if (!validOTP) {
        return res.status(400).json({ message: 'Incorrect OTP!' });
      }

      await userModel.findOneAndUpdate({ _id: userId }, { verified: true });
      await userOTPVerificationModel.deleteMany({ userId });

      return res.status(200).json({ message: 'User verified successfully' });

    } catch (err) {
      res.status(422).json({ message: 'There are invalid fields!' });
    }
  }

  public async signin(req: Request, res: Response) {
    const { email, password } = req.body;

    try {
      const user = await userModel.findOne({ email });

      if (!user) {
        return res.status(400).send({ message: 'User not found!' });
      }

      const validPassword = await user.comparePasswords(password);
      if (!validPassword) {
        return res.status(400).send({ message: 'Incorrect password!' });
      }

      const { verified } = user;
      if (verified !== true) {
        return res.status(400).send({ message: 'User is not verified!' });
      }

      return res.status(200).json({
        token: user.generateToken(),
        refreshToken: user.generateRefreshToken(),
      });
    } catch (err) {
      res.status(422).json({ message: 'There are invalid fields!' });
    }
  }

  public async forgotPassword(req: Request, res: Response) {
    const { email } = req.body;

    try {
      const user = await userModel.findOne({ email });

      if (!user) {
        return res.status(400).send({ message: 'User not found!' });
      }

      const otp = `${Math.floor(100000 + Math.random() * 900000)}`;
      const timeToExpire = 1;

      await userForgotPasswordModel.create({
        userId: user._id,
        otp: otp,
        createdAt: new Date(),
        expiredAt: new Date(new Date().getTime() + (timeToExpire * 60000)),
        verified: false
      });

      mail.to = email;
      mail.subject = 'Confirmação de reset de senha';
      mail.partialsDir = path.resolve('./src/emailTemplates/resetPassword');
      mail.layoutsDir = path.resolve('./src/emailTemplates/resetPassword');
      mail.defaultLayout = "";
      mail.viewPath = path.resolve('./src/emailTemplates/resetPassword');
      mail.context = {
        otp
      }

      const result = mail.sendMail();

      return res.status(200).json({ message: 'Email sent successfully', result });

    } catch (err) {
      res.status(422).json({ message: 'There are invalid fields!' });
    }
  }

  public async forgotPasswordVerify(req: Request, res: Response) {
    const { userId, otp } = req.body;

    try {
      if (!userId || !otp) {
        return res.status(400).json({ message: 'Invalid request!' });
      }

      const userForgotPassword = await userForgotPasswordModel.findOne({ userId });
      if (!userForgotPassword) {
        return res.status(400).json({ message: 'User not found!' });
      }

      const { expiredAt } = userForgotPassword;
      if (expiredAt < new Date()) {
        await userForgotPasswordModel.deleteMany({ userId });
        return res.status(400).json({ message: 'OTP has expired!' });
      }

      const validOTP = await userForgotPassword.compareOTP(otp);
      if (!validOTP) {
        return res.status(400).json({ message: 'Incorrect OTP!' });
      }

      await userForgotPasswordModel.findOneAndUpdate({ userId: userId }, { verified: true });

      return res.status(200).json({ message: 'Token verified' });

    } catch (err) {
      res.status(422).json({ message: 'There are invalid fields!' });
    }
  }

  public async resetPassword(req: Request, res: Response) {
    const { userId, password } = req.body;

    try {
      const user = await userForgotPasswordModel.findOne({ userId });

      if (!user) {
        return res.status(400).send({ message: 'User not found!' });
      }

      if (!userId || !password) {
        return res.status(400).json({ message: 'Invalid resquest!' });
      }

      const { verified } = user;
      if (verified !== true) {
        return res.status(400).send({ message: 'Email is not verified!' });
      }

      const newPassword = await bcrypt.hash(password, 8);
      await userModel.findOneAndUpdate({ _id: userId }, { password: newPassword });
      await userForgotPasswordModel.deleteMany({ userId });

      return res.status(200).json({ message: 'Password reset successfully' });

    } catch (err) {
      res.status(422).json({ message: 'There are invalid fields!' });
    }
  }
}

export default new UserController();