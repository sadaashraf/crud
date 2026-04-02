import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

import { EmailService } from '../email/email.service';
import { User } from './entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { Role } from 'src/utils/role.emu';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './strategies/wt-payload.interface';
import { ResendVerificationDto } from './dto/emailVerify.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) { }

  async validateUser(id: number): Promise<Omit<User, 'password'> | null> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) return null;

    const { password, ...result } = user;
    return result; // { id, email, role, isEmailVerified, createdAt }
  }

  // ─── Register ────────────────────────────────────────────────────────────────
  async register(dto: RegisterDto) {
    const exists = await this.userRepo.findOne({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email already in use');

    const hashed = await bcrypt.hash(dto.password, 10);

    // Generate verification token + expiry (24 hours)
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

    // Send verification email via SendGrid
    await this.emailService.sendVerificationEmail(dto.email, verificationToken);

    return {
      message: 'Registration successful. Please check your email to verify your account.',
    };
  }

  // ─── Login ───────────────────────────────────────────────────────────────────
  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const match = await bcrypt.compare(dto.password, user.password);
    if (!match) throw new UnauthorizedException('Invalid credentials');

    // Warn but still allow login — restrict features via EmailVerifiedGuard
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      isEmailVerified: user.isEmailVerified,
      message: user.isEmailVerified
        ? 'Login successful'
        : 'Login successful. Please verify your email to access all features.',
    };
  }

  // ─── Verify Email ─────────────────────────────────────────────────────────────
  async verifyEmail(token: string) {
    const user = await this.userRepo.findOne({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    if (user.isEmailVerified) {
      return { message: 'Email is already verified' };
    }

    // Check if token has expired
    if (
      !user.emailVerificationTokenExpiry ||
      new Date() > user.emailVerificationTokenExpiry
    ) {
      throw new BadRequestException(
        'Verification token has expired. Please request a new one at POST /auth/resend-verification',
      );
    }

    // Mark as verified and clear token
    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationTokenExpiry = null;
    await this.userRepo.save(user);

    return { message: 'Email verified successfully. You now have full access.' };
  }

  // ─── Resend Verification ──────────────────────────────────────────────────────
  async resendVerification(dto: ResendVerificationDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });

    // Always return success to prevent email enumeration attacks
    if (!user || user.isEmailVerified) {
      return {
        message: 'If this email exists and is unverified, a new verification email has been sent.',
      };
    }

    // Generate a fresh token + expiry
    const verificationToken = uuidv4();
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 24);

    user.emailVerificationToken = verificationToken;
    user.emailVerificationTokenExpiry = expiry;
    await this.userRepo.save(user);

    await this.emailService.sendVerificationEmail(user.email, verificationToken);

    return {
      message: 'If this email exists and is unverified, a new verification email has been sent.',
    };
  }
}