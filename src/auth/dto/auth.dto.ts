import { IsEmail, IsString, MinLength, IsEnum, IsOptional, Length } from 'class-validator';
import { Role } from 'src/utils/role.emu';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}

export class ResendVerificationDto {
  @IsEmail()
  email!: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @IsString()
  @MinLength(6)
  newPassword!: string;

  @IsString()
  @MinLength(6)
  confirmPassword!: string;
}

// ─── 2FA DTOs ─────────────────────────────────────────────────────────────────
export class TwoFactorVerifyDto {
  @IsString()
  @Length(6, 6, { message: '2FA code must be exactly 6 digits' })
  code!: string;
}

export class TwoFactorLoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;

  @IsOptional()
  @IsString()
  @Length(6, 6, { message: '2FA code must be exactly 6 digits' })
  twoFactorCode?: string;
}

// ─── Email OTP DTOs ───────────────────────────────────────────────────────────
export class EmailOtpVerifyDto {
  @IsString()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  code!: string;
}