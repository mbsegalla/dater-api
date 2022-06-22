import "dotenv/config";

class Configs {
  public service = "gmail";
  public host = "smtp.gmail.com";
  public user = process.env.AUTH_EMAIL_USER;
  public password = process.env.AUTH_EMAIL_PASSWORD;
  public from = process.env.EMAIL_USER;
}

export default new Configs;