// import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import * as speakeasy from 'speakeasy';
// import * as QRCode from 'qrcode';
// import { User } from '../user/user.entity';

// @Injectable()
// export class TwoFactorService {
//   constructor(
//     @InjectRepository(User)
//     private readonly userRepo: Repository<User>,
//   ) {}

//   // ─── Step 1: Generate secret + QR code for setup ──────────────────────────────
//   async generateTwoFactorSecret(userId: number) {
//     const user = await this.userRepo.findOne({ where: { id: userId } });
//     if (!user) throw new BadRequestException('User not found');

//     if (user.isTwoFactorEnabled) {
//       throw new BadRequestException('2FA is already enabled for this account');
//     }

//     // Generate a secret key
//     const secret = speakeasy.generateSecret({
//       name: `NestAuth (${user.email})`,  // shown in authenticator app
//       length: 20,
//     });

//     // Save secret temporarily (not enabled yet until verified)
//     user.twoFactorSecret = secret.base32;
//     await this.userRepo.save(user);

//     // Generate QR code as base64 image — user scans this with Google Authenticator
//     const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url!);

//     return {
//       secret: secret.base32,   // manual entry fallback
//       qrCode: qrCodeDataUrl,   // scan this in authenticator app
//       message: 'Scan the QR code with Google Authenticator or Authy, then call POST /auth/2fa/enable with the 6-digit code to activate 2FA',
//     };
//   }

//   // ─── Step 2: Enable 2FA after user verifies the code ─────────────────────────
//   async enableTwoFactor(userId: number, code: string) {
//     const user = await this.userRepo.findOne({ where: { id: userId } });
//     if (!user) throw new BadRequestException('User not found');
//     if (!user.twoFactorSecret) throw new BadRequestException('Please call POST /auth/2fa/setup first');
//     if (user.isTwoFactorEnabled) throw new BadRequestException('2FA is already enabled');

//     // Verify the code matches the secret
//     const isValid = this.verifyCode(user.twoFactorSecret, code);
//     if (!isValid) {
//       throw new UnauthorizedException('Invalid 2FA code. Please try again.');
//     }

//     // Now officially enable 2FA
//     user.isTwoFactorEnabled = true;
//     await this.userRepo.save(user);

//     return { message: '2FA enabled successfully. You will need your authenticator app on every login.' };
//   }

//   // ─── Step 3: Verify 2FA code during login ────────────────────────────────────
//   async verifyTwoFactorCode(userId: number, code: string): Promise<boolean> {
//     const user = await this.userRepo.findOne({ where: { id: userId } });
//     if (!user || !user.twoFactorSecret) return false;

//     return this.verifyCode(user.twoFactorSecret, code);
//   }

//   // ─── Disable 2FA ──────────────────────────────────────────────────────────────
//   async disableTwoFactor(userId: number, code: string) {
//     const user = await this.userRepo.findOne({ where: { id: userId } });
//     if (!user) throw new BadRequestException('User not found');
//     if (!user.isTwoFactorEnabled) throw new BadRequestException('2FA is not enabled');

//     // Must verify current code before disabling
//     const isValid = this.verifyCode(user.twoFactorSecret!, code);
//     if (!isValid) {
//       throw new UnauthorizedException('Invalid 2FA code');
//     }

//     user.isTwoFactorEnabled = false;
//     user.twoFactorSecret = null;
//     await this.userRepo.save(user);

//     return { message: '2FA disabled successfully.' };
//   }

//   // ─── Core TOTP verification ───────────────────────────────────────────────────
//   private verifyCode(secret: string, code: string): boolean {
//     return speakeasy.totp.verify({
//       secret,
//       encoding: 'base32',
//       token: code,
//       window: 1,  // allow 30 seconds clock drift (1 step before/after)
//     });
//   }
// }