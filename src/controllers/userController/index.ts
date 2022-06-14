import { Request, Response } from "express";
import "dotenv/config";
import userModel from "../../models/userModel";
import userOTPVerificationModel from "../../models/userOTPVerificationModel";
import nodemailer from "nodemailer";
import hbs from "nodemailer-express-handlebars";
import path from "path";
import userForgotPasswordModel from "../../models/userForgotPasswordModel";
import bcrypt from "bcrypt";

const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  auth: {
    user: process.env.AUTH_EMAIL,
    pass: process.env.AUTH_PASSWORD,
  }
});

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

      const mailOptions = {
        from: "mbsegalla@gmail.com",
        to: newUser.email,
        subject: 'Confirmação de e-mail',
        template: 'email',
        context: {
          name: data.name,
          otp
        }
      }

      const handlebarsOptions = {
        viewEngine: {
          extName: '.hbs',
          partialsDir: path.resolve('./src/templates/confirmationEmail'),
          layoutsDir: path.resolve('./src/templates/confirmationEmail'),
          defaultLayout: '',
        },
        viewPath: path.resolve('./src/templates/confirmationEmail'),
        extName: '.hbs',
      }

      transporter.use('compile', hbs(handlebarsOptions));

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });

      return res.status(201).json(data);

    } catch (err) {
      res.status(422).json({ message: 'There are invalid fields!' });
    }
  }

  public async verifyOTP(req: Request, res: Response) {
    const { userId, otp } = req.body;

    try {
      if (!userId || !otp) {
        return res.status(400).json({ message: 'Error!' });
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

      return res.status(200).json({
        token: user.generateToken(),
        refreshToken: user.generateRefreshToken(),
      });
    } catch (err) {
      res.status(422).json({ message: 'There are invalid fields!' });
    }
  }

  public async sendEmailforgotPassword(req: Request, res: Response) {
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
      });

      const mailOptions = {
        from: "mbsegalla@gmail.com",
        to: email,
        subject: 'Confirmação de e-mail',
        html: `<h1>Reset de senha ${otp}</h1>`
      }

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });

      return res.status(200).json({ message: 'Email sent successfully' });

    } catch (err) {
      res.status(422).json({ message: 'There are invalid fields!' });
    }
  }

  public async verifyForgotPasswordOTP(req: Request, res: Response) {
    const { userId, otp } = req.body;

    try {
      if (!userId || !otp) {
        return res.status(400).json({ message: 'Error!' });
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

      await userForgotPasswordModel.findOneAndUpdate({ _id: userId }, { verified: true });

      return res.status(200).json({ message: 'User verified successfully' });

    } catch (err) {
      res.status(422).json({ message: 'There are invalid fields!' });
    }
  }

  public async resetPassword(req: Request, res: Response) {
    const { userId, password } = req.body;

    try {
      if (!userId || !password) {
        return res.status(400).json({ message: 'Error!' });
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