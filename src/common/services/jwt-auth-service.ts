import { Inject, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { promisify } from 'util';
import * as jwt from 'jsonwebtoken';
export class JwtAuthService {
  @Inject(UsersService)
  private readonly userService: UsersService;

  async verifyJwtToken(token) {
    try {
      const decoded = await promisify(jwt.verify.bind(jwt))(
        token,
        process.env.JWT_SECRET,
      );
      const currentUser = await this.userService.findOne({ _id: decoded.id });
      if (!currentUser) {
        throw new UnauthorizedException(
          'The user belonging to this token no longer exist.',
        );
      }
      return currentUser;
    } catch (error) {
      console.log(error);
      throw new UnauthorizedException(
        'Auth token not found or expired , Please login again',
      );
    }
  }
}
