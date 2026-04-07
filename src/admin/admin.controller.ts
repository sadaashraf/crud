// import {
//   Controller,
//   Get,
//   Delete,
//   Patch,
//   Param,
//   Body,
//   ParseIntPipe,
//   UseGuards,
//   HttpCode,
//   HttpStatus,
// } from '@nestjs/common';

// import { JwtAuthGuard } from 'src/auth/strategies/jwt.auth.guard';
// import { RolesGuard } from 'src/auth/strategies/roles.guard';
// import { AdminService } from './admin.services';
// import { Roles } from 'src/auth/strategies/roles.decorator';
// import { CurrentUser } from 'src/auth/strategies/user.decorator';
// import { Role } from 'src/utils/role.emu';
// import { UpdateRoleDto } from './dto/update-role.dto';


// @Controller('admin')
// @UseGuards(JwtAuthGuard, RolesGuard) // All routes in this controller require auth
// export class AdminController {
//   constructor(private readonly adminService: AdminService) { }

//   // ─── ADMIN ONLY ROUTES ───────────────────────────────────────────────────────

//   // GET /admin/users — fetch all users
//   @Get('users')
//   @Roles(Role.ADMIN)
//   getAllUsers() {
//     return this.adminService.getAllUsers();
//   }

//   // GET /admin/users/:id — fetch a single user
//   @Get('users/:id')
//   @Roles(Role.ADMIN)
//   getUserById(@Param('id', ParseIntPipe) id: number) {
//     return this.adminService.getUserById(id);
//   }

//   // PATCH /admin/users/:id/role — change a user's role
//   @Patch('users/:id/role')
//   @Roles(Role.ADMIN)
//   updateRole(
//     @Param('id', ParseIntPipe) id: number,
//     @Body() dto: UpdateRoleDto,
//   ) {
//     return this.adminService.updateUserRole(id, dto.role);
//   }

//   // DELETE /admin/users/:id — delete a user
//   @Delete('users/:id')
//   @Roles(Role.ADMIN)
//   @HttpCode(HttpStatus.OK)
//   deleteUser(@Param('id', ParseIntPipe) id: number) {
//     return this.adminService.deleteUser(id);
//   }

//   // ─── MODERATOR + ADMIN ROUTES ────────────────────────────────────────────────

//   // GET /admin/dashboard — accessible by admin and moderator
//   @Get('dashboard')
//   @Roles(Role.ADMIN, Role.MODERATOR)
//   getDashboard(@CurrentUser() user: any) {
//     return {
//       message: `Welcome to the dashboard, ${user.email}`,
//       role: user.role,
//     };
//   }
// }
import {
  Controller,
  Get,
  Delete,
  Patch,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/strategies/jwt.auth.guard';
import { RolesGuard } from 'src/auth/strategies/roles.guard';
import { AdminService } from './admin.services';
import { Role } from 'src/utils/role.emu';
import { Roles } from 'src/auth/strategies/roles.decorator';
import { CurrentUser } from 'src/auth/strategies/user.decorator';
import { ActivityAction } from 'src/activity-log/entities/activity-log.entity';
import { UpdateRoleDto } from './dto/update-role.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) { }

  // ─── User Management ──────────────────────────────────────────────────────────
  @Get('users')
  @Roles(Role.ADMIN)
  getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Get('users/:id')
  @Roles(Role.ADMIN)
  getUserById(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getUserById(id);
  }

  @Patch('users/:id/role')
  @Roles(Role.ADMIN)
  updateRole(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRoleDto) {
    return this.adminService.updateUserRole(id, dto.role);
  }

  @Delete('users/:id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteUser(id);
  }

  // ─── Activity Logs ────────────────────────────────────────────────────────────

  // GET /admin/logs?page=1&limit=20&userId=5&action=LOGIN_FAILED&from=2024-01-01&to=2024-12-31
  @Get('logs')
  @Roles(Role.ADMIN)
  getLogs(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('userId') userId?: string,
    @Query('action') action?: ActivityAction,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.adminService.getLogs({
      page: parseInt(page),
      limit: parseInt(limit),
      userId: userId ? parseInt(userId) : undefined,
      action: action ?? undefined,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  // GET /admin/logs/user/:id?page=1&limit=20
  @Get('logs/user/:id')
  @Roles(Role.ADMIN)
  getLogsByUser(
    @Param('id', ParseIntPipe) id: number,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.adminService.getLogsByUser(id, parseInt(page), parseInt(limit));
  }

  // ─── Dashboard ────────────────────────────────────────────────────────────────
  @Get('dashboard')
  @Roles(Role.ADMIN, Role.MODERATOR)
  getDashboard(@CurrentUser() user: any) {
    return { message: `Welcome to the dashboard, ${user.email}`, role: user.role };
  }
}