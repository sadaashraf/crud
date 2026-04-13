import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import sgMail from '@sendgrid/mail';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly fromEmail = process.env.SENDGRID_FROM_EMAIL || 'nayeemashraf92@gmail.com';
  private readonly appUrl = process.env.APP_URL || 'http://localhost:3000';

  constructor() {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      this.logger.warn('SENDGRID_API_KEY is not set — emails will not be sent');
      return;
    }
    sgMail.setApiKey(apiKey);
  }

  // ─── Verification Email ───────────────────────────────────────────────────────
  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${this.appUrl}/auth/verify-email/${token}`;
    const msg = {
      to: email,
      from: this.fromEmail,
      subject: 'Verify your email address',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <h2>Verify Your Email</h2>
          <p>Thanks for registering! Click the button below to verify your email.</p>
          <p>This link expires in <strong>24 hours</strong>.</p>
          <a href="${verificationUrl}"
            style="display:inline-block;padding:12px 24px;background:#4F46E5;
            color:white;text-decoration:none;border-radius:6px;margin:16px 0;">
            Verify Email
          </a>
          <p style="color:#6B7280;">${verificationUrl}</p>
          <hr/>
          <p style="color:#9CA3AF;font-size:12px;">If you did not create an account, ignore this email.</p>
        </div>`,
    };
    try {
      await sgMail.send(msg);
      this.logger.log(`Verification email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${email}`, error);
      throw new InternalServerErrorException('Failed to send verification email');
    }
  }

  // ─── Password Reset Email ─────────────────────────────────────────────────────
  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${this.appUrl}/auth/reset-password/${token}`;
    const msg = {
      to: email,
      from: this.fromEmail,
      subject: 'Reset your password',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <h2>Reset Your Password</h2>
          <p>We received a request to reset your password.</p>
          <p>This link expires in <strong>1 hour</strong>.</p>
          <a href="${resetUrl}"
            style="display:inline-block;padding:12px 24px;background:#DC2626;
            color:white;text-decoration:none;border-radius:6px;margin:16px 0;">
            Reset Password
          </a>
          <p style="color:#6B7280;">${resetUrl}</p>
          <hr/>
          <p style="color:#9CA3AF;font-size:12px;">This link can only be used once and expires in 1 hour.</p>
        </div>`,
    };
    try {
      await sgMail.send(msg);
      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send reset email to ${email}`, error);
      throw new InternalServerErrorException('Failed to send password reset email');
    }
  }

  // ─── Email OTP ────────────────────────────────────────────────────────────────
  async sendOtpEmail(email: string, otp: string): Promise<void> {
    const msg = {
      to: email,
      from: this.fromEmail,
      subject: 'Your login verification code',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <h2>Your Login Code</h2>
          <p>Use the code below to complete your login.</p>
          <p>This code expires in <strong>10 minutes</strong>.</p>

          <!-- Big OTP display -->
          <div style="
            text-align:center;
            margin: 32px 0;
            padding: 24px;
            background: #F3F4F6;
            border-radius: 12px;
            letter-spacing: 12px;
            font-size: 42px;
            font-weight: bold;
            color: #1F2937;
          ">
            ${otp}
          </div>

          <p style="color:#6B7280;font-size:14px;">
            If you did not attempt to log in, someone may have your password.
            Please change it immediately.
          </p>
          <hr/>
          <p style="color:#9CA3AF;font-size:12px;">
            This code can only be used once and expires in 10 minutes.
          </p>
        </div>`,
    };
    try {
      await sgMail.send(msg);
      this.logger.log(`OTP email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP to ${email}`, error);
      throw new InternalServerErrorException('Failed to send OTP email');
    }
  }
}

// import {
//   Injectable,
//   InternalServerErrorException,
//   Logger,
// } from '@nestjs/common';
// import sgMail from '@sendgrid/mail';

// @Injectable()
// export class EmailService {
//   private readonly logger = new Logger(EmailService.name);
//   private readonly fromEmail =
//     process.env.SENDGRID_FROM_EMAIL || 'nayeemashraf92@gmail.com';
//   private readonly appUrl = process.env.APP_URL || 'http://localhost:3000';

//   constructor() {
//     const apiKey = process.env.SENDGRID_API_KEY;
//     if (!apiKey) {
//       this.logger.warn('SENDGRID_API_KEY is not set — emails will not be sent');
//       return;
//     }

//     const fromEmail = process.env.SENDGRID_FROM_EMAIL;
//     if (!fromEmail) {
//       throw new Error('SENDGRID_FROM_EMAIL is not set in .env'); // fail fast
//     }

//     sgMail.setApiKey(apiKey);
//   }
//   async sendVerificationEmail(email: string, token: string): Promise<void> {
//     const verificationUrl = `${this.appUrl}/auth/verify-email/${token}`;

//     const msg = {
//       to: email,
//       from: this.fromEmail,
//       subject: 'Verify your email address',
//       html: `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//           <h2>Verify Your Email</h2>
//           <p>Thanks for registering! Please verify your email address by clicking the button below.</p>
//           <p>This link expires in <strong>24 hours</strong>.</p>
//           <a
//             href="${verificationUrl}"
//             style="
//               display: inline-block;
//               padding: 12px 24px;
//               background-color: #4F46E5;
//               color: white;
//               text-decoration: none;
//               border-radius: 6px;
//               margin: 16px 0;
//             "
//           >
//             Verify Email
//           </a>
//           <p>Or copy and paste this link into your browser:</p>
//           <p style="color: #6B7280; word-break: break-all;">${verificationUrl}</p>
//           <hr />
//           <p style="color: #9CA3AF; font-size: 12px;">
//             If you did not create an account, you can safely ignore this email.
//           </p>
//         </div>
//       `,
//     };

//     try {
//       await sgMail.send(msg);
//       this.logger.log(`Verification email sent to ${email}`);
//     } catch (error) {
//       this.logger.error(`Failed to send email to ${email}`, error);
//       throw new InternalServerErrorException(
//         'Failed to send verification email',
//       );
//     }
//   }

//   async sendPasswordResetEmail(email: string, token: string): Promise<void> {
//     const resetUrl = `${this.appUrl}/auth/reset-password/${token}`;

//     const msg = {
//       to: email,
//       from: this.fromEmail,
//       subject: 'Reset your password',
//       html: `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//           <h2>Reset Your Password</h2>
//           <p>You requested a password reset. Click the button below to set a new password.</p>
//           <p>This link expires in <strong>1 hour</strong> and can only be used once.</p>
//           <a
//             href="${resetUrl}"
//             style="
//               display: inline-block;
//               padding: 12px 24px;
//               background-color: #4F46E5;
//               color: white;
//               text-decoration: none;
//               border-radius: 6px;
//               margin: 16px 0;
//             "
//           >
//             Reset Password
//           </a>
//           <p>Or copy and paste this link into your browser:</p>
//           <p style="color: #6B7280; word-break: break-all;">${resetUrl}</p>
//           <hr />
//           <p style="color: #9CA3AF; font-size: 12px;">
//             If you did not request a password reset, you can safely ignore this email.
//           </p>
//         </div>
//       `,
//     };

//     try {
//       await sgMail.send(msg);
//       this.logger.log(`Password reset email sent to ${email}`);
//     } catch (error) {
//       this.logger.error(
//         `Failed to send password reset email to ${email}`,
//         error,
//       );
//       throw new InternalServerErrorException(
//         'Failed to send password reset email',
//       );
//     }
//   }
// }
