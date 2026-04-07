// import { Injectable } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import { ActivityLog, ActivityAction } from './entities/activity-log.entity';

// @Injectable()
// export class ActivityLogService {
//   constructor(
//     @InjectRepository(ActivityLog)
//     private readonly logRepo: Repository<ActivityLog>,
//   ) { }

//   async log(action: ActivityAction, userId?: number, ipAddress?: string) {
//     const entry = this.logRepo.create({ action, userId, ipAddress: ipAddress ?? null });
//     await this.logRepo.save(entry);
//   }

//   async findAll(filters: {
//     userId?: number;
//     action?: ActivityAction;
//     page?: number;
//     limit?: number;
//   }) {
//     const { userId, action, page = 1, limit = 20 } = filters;

//     const qb = this.logRepo.createQueryBuilder('log').orderBy('log.timestamp', 'DESC');

//     if (userId) qb.andWhere('log.userId = :userId', { userId });
//     if (action) qb.andWhere('log.action = :action', { action });

//     const [data, total] = await qb
//       .skip((page - 1) * limit)
//       .take(limit)
//       .getManyAndCount();

//     return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
//   }
// }
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import { Request } from 'express';
import { ActivityAction, ActivityLog } from './entities/activity-log.entity';


export interface LogActivityOptions {
  userId?: number | null;
  action: ActivityAction;
  metadata?: Record<string, any>;
  req?: Request;
}

export interface GetLogsOptions {
  page?: number;
  limit?: number;
  userId?: number;
  action?: ActivityAction;
  from?: Date;
  to?: Date;
}

@Injectable()
export class ActivityLogService {
  private readonly logger = new Logger(ActivityLogService.name);

  constructor(
    @InjectRepository(ActivityLog)
    private readonly logRepo: Repository<ActivityLog>,
  ) { }

  // ─── Log an activity ──────────────────────────────────────────────────────────
  async log(options: LogActivityOptions): Promise<void> {
    try {
      const { userId, action, metadata, req } = options;

      // ✅ Strip any sensitive keys from metadata before saving
      const safeMetadata = metadata ? this.sanitize(metadata) : null;

      const entry = this.logRepo.create({
        userId: userId ?? null,
        action,
        metadata: safeMetadata,
        ipAddress: req ? this.extractIp(req) : null,
        userAgent: req ? req.headers['user-agent'] ?? null : null,
      });

      await this.logRepo.save(entry);
    } catch (err) {
      // Never let logging crash the main flow
      this.logger.error('Failed to write activity log', err);
    }
  }

  // ─── Get logs with filtering + pagination ─────────────────────────────────────
  async getLogs(options: GetLogsOptions) {
    const {
      page = 1,
      limit = 20,
      userId,
      action,
      from,
      to,
    } = options;

    const where: FindOptionsWhere<ActivityLog> = {};

    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (from && to) where.createdAt = Between(from, to);

    const [data, total] = await this.logRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['user'],
    });

    // Remove password from user relation
    const sanitizedData = data.map((log) => ({
      ...log,
      user: log.user
        ? { id: log.user.id, email: log.user.email, role: log.user.role }
        : null,
    }));

    return {
      data: sanitizedData,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    };
  }

  // ─── Get logs for a specific user ─────────────────────────────────────────────
  async getLogsByUser(userId: number, page = 1, limit = 20) {
    return this.getLogs({ userId, page, limit });
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  // Extract real IP — handles proxies/load balancers
  private extractIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      return (Array.isArray(forwarded) ? forwarded[0] : forwarded).split(',')[0].trim();
    }
    return req.socket?.remoteAddress ?? req.ip ?? 'unknown';
  }

  // Remove sensitive fields from metadata before saving
  private sanitize(data: Record<string, any>): Record<string, any> {
    const SENSITIVE_KEYS = [
      'password', 'confirmPassword', 'newPassword',
      'token', 'accessToken', 'refreshToken',
      'secret', 'apiKey', 'creditCard',
    ];

    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (!SENSITIVE_KEYS.includes(key)) {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }
}