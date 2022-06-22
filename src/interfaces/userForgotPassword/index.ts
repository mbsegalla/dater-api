export interface UserForgotPasswordInterface {
  userId: string;
  otp: string;
  createdAt: Date;
  expiredAt: Date;
  passwordVerified: boolean;
}