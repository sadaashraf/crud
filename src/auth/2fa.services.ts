import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailService } from '../email/email.service';
import { User } from './entities/user.entity';

@Injectable()
export class EmailOtpService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly emailService: EmailService,
  ) { }

  // ─── Enable Email OTP for account ────────────────────────────────────────────
  async enableEmailOtp(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    if (user.isEmailOtpEnabled) {
      throw new BadRequestException('Email OTP 2FA is already enabled');
    }

    user.isEmailOtpEnabled = true;
    await this.userRepo.save(user);

    return {
      message: 'Email OTP 2FA enabled. You will receive a code on every login.',
    };
  }

  // ─── Disable Email OTP ────────────────────────────────────────────────────────
  async disableEmailOtp(userId: number, code: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');
    if (!user.isEmailOtpEnabled) throw new BadRequestException('Email OTP is not enabled');

    // Must verify current OTP before disabling
    await this.verifyOtp(userId, code);

    user.isEmailOtpEnabled = false;
    user.emailOtpCode = null;
    user.emailOtpExpiry = null;
    await this.userRepo.save(user);

    return { message: 'Email OTP 2FA disabled successfully.' };
  }

  // ─── Send OTP during login ────────────────────────────────────────────────────
  async sendLoginOtp(userId: number): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    // Generate 6 digit random OTP
    const otp = this.generateOtp();

    // Expires in 10 minutes
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 10);

    // Save OTP to DB
    user.emailOtpCode = otp;
    user.emailOtpExpiry = expiry;
    await this.userRepo.save(user);

    // Send via SendGrid
    await this.emailService.sendOtpEmail(user.email, otp);
  }

  // ─── Verify OTP ───────────────────────────────────────────────────────────────
  async verifyOtp(userId: number, code: string): Promise<boolean> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    // No OTP generated yet
    if (!user.emailOtpCode || !user.emailOtpExpiry) {
      throw new BadRequestException(
        'No OTP found. Please login again to receive a new code.',
      );
    }

    // Check expiry
    if (new Date() > user.emailOtpExpiry) {
      // Clear expired OTP
      user.emailOtpCode = null;
      user.emailOtpExpiry = null;
      await this.userRepo.save(user);
      throw new BadRequestException(
        'OTP has expired. Please login again to receive a new code.',
      );
    }

    // Check code matches
    if (user.emailOtpCode !== code) {
      throw new UnauthorizedException('Invalid OTP code. Please try again.');
    }

    // ✅ Valid — clear OTP (one-time use)
    user.emailOtpCode = null;
    user.emailOtpExpiry = null;
    await this.userRepo.save(user);

    return true;
  }

  // ─── Resend OTP ───────────────────────────────────────────────────────────────
  async resendOtp(userId: number): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');
    if (!user.isEmailOtpEnabled) throw new BadRequestException('Email OTP is not enabled');

    await this.sendLoginOtp(userId);

    return { message: 'A new OTP has been sent to your email.' };
  }

  // ─── Generate 6 digit OTP ─────────────────────────────────────────────────────
  private generateOtp(): string {
    // Generates a random 6 digit number e.g. "048291"
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}