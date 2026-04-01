import {
  Controller,
  Get,
  Delete,
  Patch,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';

import { IsEnum } from 'class-validator';
import { JwtAuthGuard } from 'src/auth/strategies/jwt.auth.guard';
import { RolesGuard } from 'src/auth/strategies/roles.guard';
import { Role } from 'src/utils/role.emu';
import { AdminService } from './admin.services';
import { Roles } from 'src/auth/strategies/roles.decorator';
import { CurrentUser } from 'src/auth/strategies/user.decorator';

class UpdateRoleDto {
  @IsEnum(Role)
  role: Role;
}

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard) // All routes in this controller require auth
export class AdminController {
  constructor(private readonly adminService: AdminService) { }

  // ─── ADMIN ONLY ROUTES ───────────────────────────────────────────────────────

  // GET /admin/users — fetch all users
  @Get('users')
  @Roles(Role.ADMIN)
  getAllUsers() {
    return this.adminService.getAllUsers();
  }

  // GET /admin/users/:id — fetch a single user
  @Get('users/:id')
  @Roles(Role.ADMIN)
  getUserById(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getUserById(id);
  }

  // PATCH /admin/users/:id/role — change a user's role
  @Patch('users/:id/role')
  @Roles(Role.ADMIN)
  updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.adminService.updateUserRole(id, dto.role);
  }

  // DELETE /admin/users/:id — delete a user
  @Delete('users/:id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteUser(id);
  }

  // ─── MODERATOR + ADMIN ROUTES ────────────────────────────────────────────────

  // GET /admin/dashboard — accessible by admin and moderator
  @Get('dashboard')
  @Roles(Role.ADMIN, Role.MODERATOR)
  getDashboard(@CurrentUser() user: any) {
    return {
      message: `Welcome to the dashboard, ${user.email}`,
      role: user.role,
    };
  }
}