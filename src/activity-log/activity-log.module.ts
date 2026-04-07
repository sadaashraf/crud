// import { Module } from '@nestjs/common';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { ActivityLog } from './entities/activity-log.entity';
// import { ActivityLogService } from './activity-log.service';

// @Module({
//   imports: [TypeOrmModule.forFeature([ActivityLog])],
//   providers: [ActivityLogService],
//   exports: [ActivityLogService],
// })
// export class ActivityLogModule { }
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityLogService } from './activity-log.service';
import { ActivityLog } from './entities/activity-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ActivityLog])],
  providers: [ActivityLogService],
  exports: [ActivityLogService], // exported so AuthModule and AdminModule can use it
})
export class ActivityLogModule { }