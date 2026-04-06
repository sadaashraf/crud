import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog, ActivityAction } from './entities/activity-log.entity';

@Injectable()
export class ActivityLogService {
  constructor(
    @InjectRepository(ActivityLog)
    private readonly logRepo: Repository<ActivityLog>,
  ) { }

  async log(action: ActivityAction, userId?: number, ipAddress?: string) {
    const entry = this.logRepo.create({ action, userId, ipAddress: ipAddress ?? null });
    await this.logRepo.save(entry);
  }

  async findAll(filters: {
    userId?: number;
    action?: ActivityAction;
    page?: number;
    limit?: number;
  }) {
    const { userId, action, page = 1, limit = 20 } = filters;

    const qb = this.logRepo.createQueryBuilder('log').orderBy('log.timestamp', 'DESC');

    if (userId) qb.andWhere('log.userId = :userId', { userId });
    if (action) qb.andWhere('log.action = :action', { action });

    const [data, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
