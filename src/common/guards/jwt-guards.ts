import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtAuthService } from '../services/jwt-auth-service';

@Injectable()
export class JwtGuards implements CanActivate {
  @Inject(JwtAuthService)
  private readonly jwtAuthService: JwtAuthService;
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    let token;
    if (!req.headers.authorization) {
      throw new UnauthorizedException('Token not provided');
    }
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      throw new UnauthorizedException('Not Logged In');
    }
    const currentUser = await this.jwtAuthService.verifyJwtToken(token);
    if (!currentUser) {
      throw new UnauthorizedException('Invalid Jwt Token');
    }
    req.user = currentUser;
    return true;
  }

  protected getRequest<T>(context: ExecutionContext): T {
    return context.switchToHttp().getRequest();
  }
}
