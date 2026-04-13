import { Controller, Post, Get, Body, Param, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.services';
import { EmailOtpService } from './2fa.services';
import { EmailOtpVerifyDto, ForgotPasswordDto, RegisterDto, ResendVerificationDto, ResetPasswordDto, TwoFactorLoginDto } from './dto/auth.dto';
import { JwtAuthGuard } from './strategies/jwt.auth.guard';
import { CurrentUser } from './strategies/user.decorator';
import { EmailVerifiedGuard } from './strategies/emailVerify.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly emailOtpService: EmailOtpService, // ✅ only this
  ) { }

  // ─── Register & Login ─────────────────────────────────────────────────────────
  @Post('register')
  register(@Body() dto: RegisterDto, @Req() req: Request) {
    return this.authService.register(dto, req);
  }

  @Post('login')
  login(@Body() dto: TwoFactorLoginDto, @Req() req: Request) {
    return this.authService.login(dto, req);
  }

  // ─── Email Verification ───────────────────────────────────────────────────────
  @Get('verify-email/:token')
  verifyEmail(@Param('token') token: string, @Req() req: Request) {
    return this.authService.verifyEmail(token, req);
  }

  @Post('resend-verification')
  resendVerification(@Body() dto: ResendVerificationDto, @Req() req: Request) {
    return this.authService.resendVerification(dto, req);
  }

  // ─── Password Reset ───────────────────────────────────────────────────────────
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: Request) {
    return this.authService.forgotPassword(dto, req);
  }

  @Get('reset-password/:token')
  verifyResetToken(@Param('token') token: string) {
    return this.authService.verifyResetToken(token);
  }

  @Post('reset-password/:token')
  resetPassword(
    @Param('token') token: string,
    @Body() dto: ResetPasswordDto,
    @Req() req: Request,
  ) {
    return this.authService.resetPassword(token, dto, req);
  }

  // ─── Email OTP 2FA ────────────────────────────────────────────────────────────
  @Post('2fa/email/enable')
  @UseGuards(JwtAuthGuard)
  enableEmailOtp(@CurrentUser() user: any) {
    return this.emailOtpService.enableEmailOtp(user.id);
  }

  @Post('2fa/email/disable')
  @UseGuards(JwtAuthGuard)
  disableEmailOtp(@CurrentUser() user: any, @Body() dto: EmailOtpVerifyDto) {
    return this.emailOtpService.disableEmailOtp(user.id, dto.code);
  }

  @Post('2fa/email/resend')
  @UseGuards(JwtAuthGuard)
  resendEmailOtp(@CurrentUser() user: any) {
    return this.emailOtpService.resendOtp(user.id);
  }

  // ─── Protected Example ────────────────────────────────────────────────────────
  @Get('protected-feature')
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  protectedFeature(@CurrentUser() user: any) {
    return { message: `Welcome ${user.email}! You have full access.` };
  }
}
// // import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
// // import type { Request } from 'express';
// // import { AuthService } from './auth.services';
// // import { RegisterDto } from './dto/register.dto';
// // import { LoginDto } from './dto/login.dto';
// // import { ResendVerificationDto } from './dto/emailVerify.dto';
// // import { ResetPasswordDto } from './dto/resetPassword.dto';
// // import { JwtAuthGuard } from './strategies/jwt.auth.guard';
// // import { CurrentUser } from './strategies/user.decorator';
// // import { EmailVerifiedGuard } from './strategies/emailVerify.guard';


// // @Controller('auth')
// // export class AuthController {
// //   constructor(private readonly authService: AuthService) { }

// //   @Post('register')
// //   register(@Body() dto: RegisterDto, @Req() req: Request) {
// //     return this.authService.register(dto, req.ip ?? req.socket.remoteAddress);
// //   }

// //   @Post('login')
// //   login(@Body() dto: LoginDto, @Req() req: Request) {
// //     return this.authService.login(dto, req.ip ?? req.socket.remoteAddress);
// //   }

// //   @Get('verify-email/:token')
// //   verifyEmail(@Param('token') token: string) {
// //     return this.authService.verifyEmail(token);
// //   }

// //   @Post('resend-verification')
// //   resendVerification(@Body() dto: ResendVerificationDto) {
// //     return this.authService.resendVerification(dto);
// //   }

// //   @Post('forgot-password')
// //   forgotPassword(@Body('email') email: string, @Req() req: Request) {
// //     return this.authService.forgotPassword(email, req.ip ?? req.socket.remoteAddress);
// //   }

// //   @Get('reset-password/:token')
// //   verifyResetToken(@Param('token') token: string) {
// //     return this.authService.verifyResetToken(token);
// //   }

// //   @Post('reset-password/:token')
// //   resetPassword(@Param('token') token: string, @Body() dto: ResetPasswordDto, @Req() req: Request) {
// //     return this.authService.resetPassword(token, dto, req.ip ?? req.socket.remoteAddress);
// //   }

// //   @Get('protected-feature')
// //   @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
// //   protectedFeature(@CurrentUser() user: any) {
// //     return { message: `Welcome ${user.email}! You have full access.` };
// //   }
// // }
// import { Controller, Post, Get, Body, Param, Req, UseGuards } from '@nestjs/common';
// import type { Request } from 'express';
// import { AuthService } from './auth.services';
// import { RegisterDto } from './dto/register.dto';
// import { LoginDto } from './dto/login.dto';
// import { ResendVerificationDto } from './dto/emailVerify.dto';
// import { ResetPasswordDto } from './dto/resetPassword.dto';
// import { CurrentUser } from './strategies/user.decorator';
// import { EmailVerifiedGuard } from './strategies/emailVerify.guard';
// import { JwtAuthGuard } from './strategies/jwt.auth.guard';

// @Controller('auth')
// export class AuthController {
//   constructor(private readonly authService: AuthService) { }

//   @Post('register')
//   register(@Body() dto: RegisterDto, @Req() req: Request) {
//     return this.authService.register(dto, req);
//   }

//   @Post('login')
//   login(@Body() dto: LoginDto, @Req() req: Request) {
//     return this.authService.login(dto, req);
//   }

//   @Get('verify-email/:token')
//   verifyEmail(@Param('token') token: string, @Req() req: Request) {
//     return this.authService.verifyEmail(token, req);
//   }

//   @Post('resend-verification')
//   resendVerification(@Body() dto: ResendVerificationDto, @Req() req: Request) {
//     return this.authService.resendVerification(dto, req);
//   }

//   @Post('forgot-password')
//   forgotPassword(@Body() dto: ResendVerificationDto, @Req() req: Request) {
//     return this.authService.forgotPassword(dto, req);
//   }

//   @Get('reset-password/:token')
//   verifyResetToken(@Param('token') token: string) {
//     return this.authService.verifyResetToken(token);
//   }

//   @Post('reset-password/:token')
//   resetPassword(
//     @Param('token') token: string,
//     @Body() dto: ResetPasswordDto,
//     @Req() req: Request,
//   ) {
//     return this.authService.resetPassword(token, dto, req);
//   }

//   @Get('protected-feature')
//   @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
//   protectedFeature(@CurrentUser() user: any) {
//     return { message: `Welcome ${user.email}! You have full access.` };
//   }
// }