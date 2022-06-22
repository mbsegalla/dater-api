import * as nodemailer from "nodemailer";
import hbs from "nodemailer-express-handlebars";
import config from "./config";

class Mail {
  constructor(
    public to?: string,
    public subject?: string,
    public partialsDir?: string,
    public layoutsDir?: string,
    public defaultLayout?: string,
    public viewPath?: string,
    public context?: object,
  ) { }

  public sendMail() {
    const transporter = nodemailer.createTransport({
      service: config.service,
      host: config.host,
      auth: {
        user: config.user,
        pass: config.password
      }
    });

    const mailOptions = {
      from: config.from,
      to: this.to,
      subject: this.subject,
      template: 'email',
      context: this.context,
    };

    const handlebarsOptions = {
      viewEngine: {
        extName: '.hbs',
        partialsDir: this.partialsDir,
        layoutsDir: this.layoutsDir,
        defaultLayout: this.defaultLayout,
      },
      viewPath: this.viewPath || "",
      extName: '.hbs',
    }

    transporter.use('compile', hbs(handlebarsOptions));

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log(`Email sent:  ${info.response}`);
      }
    });
  }
}

export default new Mail;