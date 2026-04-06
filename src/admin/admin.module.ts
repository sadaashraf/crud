import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AuthModule } from '../auth/auth.module';

import { User } from 'src/auth/entities/user.entity';
import { AdminService } from './admin.services';
import { ActivityLogModule } from 'src/activity-log/activity-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    AuthModule,
    ActivityLogModule,
  ],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}
