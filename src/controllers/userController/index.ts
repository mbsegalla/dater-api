import { Request, Response } from "express";
import "dotenv/config";
import userModel from "../../models/userModel";
import nodemailer from "nodemailer";
import hbs from "nodemailer-express-handlebars";
import path from "path";

class UserController {
  public async signup(req: Request, res: Response) {
    const { email, dateOfBirth } = req.body;
    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      auth: {
        user: process.env.AUTH_EMAIL,
        pass: process.env.AUTH_PASSWORD,
      }
    });

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

      const mailOptions = {
        from: "mbsegalla@gmail.com",
        to: newUser.email,
        subject: 'Confirmação de e-mail',
        template: 'email',
        context: data,
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
}

export default new UserController();