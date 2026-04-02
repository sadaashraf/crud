import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.services';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ResendVerificationDto } from './dto/emailVerify.dto';
import { JwtAuthGuard } from './strategies/jwt.auth.guard';
import { CurrentUser } from './strategies/user.decorator';
import { EmailVerifiedGuard } from './strategies/emailVerify.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  // POST /auth/register — creates user + sends verification email
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // POST /auth/login — returns JWT (works even if unverified)
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // GET /auth/verify-email/:token — user clicks link from email
  @Get('verify-email/:token')
  verifyEmail(@Param('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  // POST /auth/resend-verification — request a new verification email
  @Post('resend-verification')
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto);
  }

  // ─── Example: route blocked until email is verified ───────────────────────
  // Apply JwtAuthGuard first (checks token), then EmailVerifiedGuard (checks isEmailVerified)
  @Get('protected-feature')
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  protectedFeature(@CurrentUser() user: any) {
    return { message: `Welcome ${user.email}! You have full access.` };
  }
}