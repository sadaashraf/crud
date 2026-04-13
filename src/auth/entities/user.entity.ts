import { Role } from 'src/utils/role.emu';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column({ type: 'enum', enum: Role, default: Role.USER })
  role!: Role;

  // ─── Email Verification ───────────────────────────────────────────
  @Column({ default: false })
  isEmailVerified!: boolean;

  @Column({ type: 'varchar', nullable: true })
  emailVerificationToken!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  emailVerificationTokenExpiry!: Date | null;

  // ─── Password Reset ───────────────────────────────────────────────
  @Column({ type: 'varchar', nullable: true })
  passwordResetToken!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  passwordResetTokenExpiry!: Date | null;

  // ─── 2FA — Authenticator App ──────────────────────────────────────────────────
  @Column({ default: false })
  isTwoFactorEnabled!: boolean;

  @Column({ type: 'varchar', length: 512, nullable: true })
  twoFactorSecret!: string | null;

  // ─── 2FA — Email OTP ─────────────────────────────────────────────────────────
  @Column({ default: false })
  isEmailOtpEnabled!: boolean;

  @Column({ type: 'varchar', length: 6, nullable: true })
  emailOtpCode!: string | null;         // 6 digit code

  @Column({ type: 'timestamp', nullable: true })
  emailOtpExpiry!: Date | null;         // expires in 10 minutes

  @CreateDateColumn()
  createdAt!: Date;
}



