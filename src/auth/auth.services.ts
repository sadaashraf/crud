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
import { User } from './entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { Role } from 'src/utils/role.emu';
import { LoginDto } from './dto/login.dto';
import { ResendVerificationDto } from './dto/emailVerify.dto';
import { JwtPayload } from './strategies/wt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) { }

  // ─── Called by JwtStrategy ────────────────────────────────────────────────────
  async validateUser(id: number): Promise<Omit<User, 'password'> | null> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) return null;
    const { password, ...result } = user;
    return result;
  }

  // ─── Register ─────────────────────────────────────────────────────────────────
  async register(dto: RegisterDto) {
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

    // ✅ FIX 2: Save user first, then try sending email
    // If email fails → delete the user so registration is rolled back
    await this.userRepo.save(user);

    try {
      await this.emailService.sendVerificationEmail(dto.email, verificationToken);
    } catch (error) {
      // ✅ Email failed → remove the saved user so they must register again
      await this.userRepo.remove(user);
      throw new BadRequestException(
        'Registration failed: could not send verification email. Please try again.',
      );
    }

    return {
      message: 'Registration successful. Please check your email to verify your account before logging in.',
    };
  }

  // ─── Login ────────────────────────────────────────────────────────────────────
  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const match = await bcrypt.compare(dto.password, user.password);
    if (!match) throw new UnauthorizedException('Invalid credentials');

    // ✅ FIX 1: Block login if email is not verified
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
}