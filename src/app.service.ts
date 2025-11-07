import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Welcome To MDX Voice! API is up and running. Remember: Silent was Consent.';
  }
}
