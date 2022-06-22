export interface UserOTPVerificationInterface {
  userId: string;
  otp: string;
  createdAt: Date;
  expiredAt: Date;
}