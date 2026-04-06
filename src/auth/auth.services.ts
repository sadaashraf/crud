import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { EmailService } from '../email/email.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { ActivityAction } from '../activity-log/entities/activity-log.entity';
import { User } from './entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { Role } from 'src/utils/role.emu';
import { LoginDto } from './dto/login.dto';
import { ResendVerificationDto } from './dto/emailVerify.dto';
import { ResetPasswordDto } from './dto/resetPassword.dto';
import { JwtPayload } from './strategies/wt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly activityLogService: ActivityLogService,
  ) { }

  // ─── Called by JwtStrategy ────────────────────────────────────────────────────
  async validateUser(id: number): Promise<Omit<User, 'password'> | null> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) return null;
    const { password, ...result } = user;
    return result;
  }

  // ─── Register ─────────────────────────────────────────────────────────────────
  async register(dto: RegisterDto, ipAddress?: string) {
    const exists = await this.userRepo.findOne({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email already in use');

    const hashed = await bcrypt.hash(dto.password, 10);
    const verificationToken = uuidv4();
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 24);

    const user = this.userRepo.create({
      email: dto.email,
      password: hashed,
      role: dto.role ?? Role.USER,
      isEmailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationTokenExpiry: expiry,
    });

    await this.userRepo.save(user);

    try {
      await this.emailService.sendVerificationEmail(dto.email, verificationToken);
    } catch (error) {
      await this.userRepo.remove(user);
      throw new BadRequestException(
        'Registration failed: could not send verification email. Please try again.',
      );
    }

    await this.activityLogService.log(ActivityAction.REGISTER, user.id, ipAddress);
    return {
      message: 'Registration successful. Please check your email to verify your account before logging in.',
    };
  }

  // ─── Login ────────────────────────────────────────────────────────────────────
  async login(dto: LoginDto, ipAddress?: string) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) {
      await this.activityLogService.log(ActivityAction.FAILED_LOGIN, undefined, ipAddress);
      throw new UnauthorizedException('Invalid credentials');
    }

    const match = await bcrypt.compare(dto.password, user.password);
    if (!match) {
      await this.activityLogService.log(ActivityAction.FAILED_LOGIN, user.id, ipAddress);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException(
        'Email not verified. Please check your inbox or request a new verification email at POST /auth/resend-verification',
      );
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    await this.activityLogService.log(ActivityAction.LOGIN, user.id, ipAddress);
    return {
      access_token: this.jwtService.sign(payload),
      message: 'Login successful',
    };
  }

  // ─── Verify Email ─────────────────────────────────────────────────────────────
  async verifyEmail(token: string) {
    const user = await this.userRepo.findOne({
      where: { emailVerificationToken: token },
    });

    if (!user) throw new BadRequestException('Invalid verification token');
    if (user.isEmailVerified) return { message: 'Email is already verified' };

    if (
      !user.emailVerificationTokenExpiry ||
      new Date() > user.emailVerificationTokenExpiry
    ) {
      throw new BadRequestException(
        'Verification token has expired. Please request a new one at POST /auth/resend-verification',
      );
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationTokenExpiry = null;
    await this.userRepo.save(user);

    return { message: 'Email verified successfully. You can now log in.' };
  }

  // ─── Resend Verification ──────────────────────────────────────────────────────
  async resendVerification(dto: ResendVerificationDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });

    if (!user || user.isEmailVerified) {
      return {
        message: 'If this email exists and is unverified, a new verification email has been sent.',
      };
    }

    const verificationToken = uuidv4();
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 24);

    user.emailVerificationToken = verificationToken;
    user.emailVerificationTokenExpiry = expiry;
    await this.userRepo.save(user);

    try {
      await this.emailService.sendVerificationEmail(user.email, verificationToken);
    } catch {
      throw new BadRequestException(
        'Could not send verification email. Please try again later.',
      );
    }

    return {
      message: 'If this email exists and is unverified, a new verification email has been sent.',
    };
  }

  // ─── Forgot Password ─────────────────────────────────────────────────────
  async forgotPassword(email: string, ipAddress?: string) {
    const user = await this.userRepo.findOne({ where: { email } });

    const response = {
      message: 'If this email exists, a password reset link has been sent.',
    };
    if (!user) return response;

    const token = uuidv4();
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 1);

    user.passwordResetToken = token;
    user.passwordResetTokenExpiry = expiry;
    await this.userRepo.save(user);

    try {
      await this.emailService.sendPasswordResetEmail(user.email, token);
    } catch {
      user.passwordResetToken = null;
      user.passwordResetTokenExpiry = null;
      await this.userRepo.save(user);
      throw new BadRequestException(
        'Could not send password reset email. Please try again later.',
      );
    }

    await this.activityLogService.log(ActivityAction.PASSWORD_RESET_REQUEST, user.id, ipAddress);
    return response;
  }

  // ─── Verify Reset Token ───────────────────────────────────────────────
  async verifyResetToken(token: string) {
    const user = await this.userRepo.findOne({
      where: { passwordResetToken: token },
    });
    if (
      !user ||
      !user.passwordResetTokenExpiry ||
      new Date() > user.passwordResetTokenExpiry
    ) {
      throw new BadRequestException('Invalid or expired password reset token');
    }
    return { message: 'Token is valid. You may now submit a new password.' };
  }

  // ─── Reset Password ───────────────────────────────────────────────────
  async resetPassword(token: string, dto: ResetPasswordDto, ipAddress?: string) {
    const user = await this.userRepo.findOne({
      where: { passwordResetToken: token },
    });
    if (
      !user ||
      !user.passwordResetTokenExpiry ||
      new Date() > user.passwordResetTokenExpiry
    ) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    user.password = await bcrypt.hash(dto.password, 10);
    user.passwordResetToken = null;
    user.passwordResetTokenExpiry = null;
    await this.userRepo.save(user);

    await this.activityLogService.log(ActivityAction.PASSWORD_CHANGE, user.id, ipAddress);
    return { message: 'Password has been reset successfully. You can now log in.' };
  }
}
