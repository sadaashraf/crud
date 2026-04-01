import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AuthModule } from '../auth/auth.module';

import { User } from 'src/auth/entities/user.entity';
import { AdminService } from './admin.services';
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    AuthModule, // imports JwtAuthGuard, RolesGuard, JwtModule
  ],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule { }