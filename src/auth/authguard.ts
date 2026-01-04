import { 
  CanActivate, 
  ExecutionContext, 
  Injectable, 
  UnauthorizedException 
} from '@nestjs/common';
import { AuthService } from './authservice';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split('Bearer ')[1];
    console.log('Authorization token:', token);
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const decoded = await this.authService.verifyToken(token);
      console.log('Decoded token:', decoded);
      
      // Find or create user in database
      const user = await this.authService.findOrCreateUser(decoded);
      
      // Attach both decoded token and database user to request
      request.user = user;
      request.decodedToken = decoded;
      
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
