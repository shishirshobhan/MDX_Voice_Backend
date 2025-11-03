// user.module.ts
import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UsersController } from './user.controller';
import { FirebaseModule } from '../firebase/firebase.module'; // Import the module
import { FirebaseService } from 'src/firebase/firebase.service';
import { AuthModule } from 'src/auth/auth.module';


@Module({
  imports: [FirebaseModule,AuthModule], // Add this
  controllers: [UsersController],
  providers: [UserService, FirebaseService], // Add it here],
  exports: [UserService], // Optional: if other modules need UserService
})
export class UserModule {}