import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as jwt from "jsonwebtoken"

@Injectable()
export class AuthService {
  signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });
  };
  createToken = (user) => {
    const token = this.signToken(user._id);
    return token;
  };
  async comparePassword(incomingPassword, hashedPassword) {
    return await bcrypt.compare(incomingPassword, hashedPassword);
  }
}
