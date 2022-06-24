import { NextFunction, Request, Response } from "express";
import { verify } from "jsonwebtoken";
import "dotenv/config";

class AuthenticatedToken {
  public authenticatedToken(req: Request, res: Response, next: NextFunction) {
    const authToken = req.headers.authorization;

    if (!authToken) {
      return res.status(401).json({ message: "You must be logged in!" });
    }

    const [, token] = authToken.split(" ");
    try {
      verify(token, `${process.env.APP_SECRET}`);
      return next();
    } catch (err) {
      return res.status(401).json({ message: "Invalid token!" });
    }
  }
}

export default new AuthenticatedToken();