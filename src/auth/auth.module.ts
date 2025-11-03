// auth.module.ts
import { Module } from '@nestjs/common';
import { AuthService } from './authservice';
import { FirebaseAuthGuard } from './authguard';
import { FirebaseModule } from '../firebase/firebase.module'; // Check this line!
import { PrismaModule } from 'prisma/prisma.module';

@Module({
  imports: [FirebaseModule,PrismaModule], // Make sure FirebaseModule is not undefined
  providers: [AuthService, FirebaseAuthGuard],
  exports: [AuthService, FirebaseAuthGuard],
})
export class AuthModule {}