// import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

// export enum ActivityAction {
//   LOGIN = 'LOGIN',
//   FAILED_LOGIN = 'FAILED_LOGIN',
//   PROFILE_UPDATE = 'PROFILE_UPDATE',
//   PASSWORD_CHANGE = 'PASSWORD_CHANGE',
//   PASSWORD_RESET_REQUEST = 'PASSWORD_RESET_REQUEST',
//   REGISTER = 'REGISTER',
// }

// @Entity('activity_logs')
// export class ActivityLog {
//   @PrimaryGeneratedColumn()
//   id!: number;

//   @Column({ nullable: true })
//   userId!: number;

//   @Column({ type: 'enum', enum: ActivityAction })
//   action!: ActivityAction;

//   @Column({ type: 'varchar', nullable: true })
//   ipAddress!: string | null;

//   @CreateDateColumn()
//   timestamp!: Date;
// }
import { User } from 'src/auth/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

export enum ActivityAction {

  REGISTER = 'REGISTER',
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',

  // Email actions
  EMAIL_VERIFIED = 'EMAIL_VERIFIED',
  RESEND_VERIFICATION = 'RESEND_VERIFICATION',

  // Password actions
  FORGOT_PASSWORD = 'FORGOT_PASSWORD',
  PASSWORD_RESET = 'PASSWORD_RESET',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',

  // Admin actions
  USER_DELETED = 'USER_DELETED',
  ROLE_UPDATED = 'ROLE_UPDATED',
}

@Entity('activity_logs')
@Index(['userId'])
@Index(['action'])
@Index(['createdAt'])
export class ActivityLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int', nullable: true })         // ✅ explicit int
  userId!: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'enum', enum: ActivityAction })
  action!: ActivityAction;

  @Column({ type: 'jsonb', nullable: true })        // ✅ explicit jsonb
  metadata!: Record<string, any> | null;

  @Column({ type: 'varchar', length: 64, nullable: true })   // ✅ explicit varchar
  ipAddress!: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })  // ✅ explicit varchar
  userAgent!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}