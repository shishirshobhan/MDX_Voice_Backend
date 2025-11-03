import { Injectable, UnauthorizedException } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { PrismaService } from 'prisma/prisma.service';

export interface DecodedToken {
  uid: string;
  email?: string;
  name?: string;
  picture?: string;
  email_verified?: boolean;
}

@Injectable()
export class AuthService {
  constructor(
    private firebaseService: FirebaseService,
    private prismaService: PrismaService,
  ) {}

  async verifyToken(idToken: string): Promise<DecodedToken> {
    try {
      const decoded = await this.firebaseService.getAuth().verifyIdToken(idToken);
      return decoded;
    } catch (error) {
      throw new UnauthorizedException('Invalid Firebase token');
    }
  }

  async findOrCreateUser(decodedToken: DecodedToken) {
    try {
      // Try to find existing user
      let user = await this.prismaService.user.findUnique({
        where: { firebaseUid: decodedToken.uid },
      });

      if (user) {
        // Update last login time and other details
        user = await this.prismaService.user.update({
          where: { firebaseUid: decodedToken.uid },
          data: {
            lastLoginAt: new Date(),
            email: decodedToken.email || user.email,
            displayName: decodedToken.name || user.displayName,
            photoURL: decodedToken.picture || user.photoURL,
          },
        });
      } else {
        // Create new user
        user = await this.prismaService.user.create({
          data: {
            firebaseUid: decodedToken.uid,
            email: decodedToken.email!,
            displayName: decodedToken.name,
            photoURL: decodedToken.picture,
            lastLoginAt: new Date(),
          },
        });
      }

      return user;
    } catch (error) {
      console.error('Error in findOrCreateUser:', error);
      throw error;
    }
  }

  async getUserByFirebaseUid(firebaseUid: string) {
    return this.prismaService.user.findUnique({
      where: { firebaseUid },
    });
  }

  async getUserByEmail(email: string) {
    return this.prismaService.user.findUnique({
      where: { email },
    });
  }

  async updateUser(firebaseUid: string, data: { displayName?: string; photoURL?: string }) {
    return this.prismaService.user.update({
      where: { firebaseUid },
      data,
    });
  }

  async deleteUser(firebaseUid: string) {
    return this.prismaService.user.delete({
      where: { firebaseUid },
    });
  }
}