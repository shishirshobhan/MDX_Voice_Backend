import { Controller, Get, Put, Body, UseGuards, Request, Delete } from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/authguard';
import { AuthService } from '../auth/authservice';

@Controller('users')
@UseGuards(FirebaseAuthGuard)
export class UsersController {
  constructor(private authService: AuthService) {}

  @Get('me')
  async getCurrentUser(@Request() req) {
    // User is already attached to request by FirebaseAuthGuard
    return {
      success: true,
      user: req.user,
    };
  }

  @Put('me')
  async updateCurrentUser(
    @Request() req,
    @Body() updateData: { displayName?: string; photoURL?: string },
  ) {
    const updatedUser = await this.authService.updateUser(
      req.user.firebaseUid,
      updateData,
    );

    return {
      success: true,
      user: updatedUser,
    };
  }

  @Delete('me')
  async deleteCurrentUser(@Request() req) {
    await this.authService.deleteUser(req.user.firebaseUid);
    
    return {
      success: true,
      message: 'User deleted successfully',
    };
  }
}
