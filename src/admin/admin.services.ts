// import { Injectable, NotFoundException } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { User } from 'src/auth/entities/user.entity';
// import { Role } from 'src/utils/role.emu';
// import { Repository } from 'typeorm';

// @Injectable()
// export class AdminService {
//   constructor(
//     @InjectRepository(User)
//     private readonly userRepo: Repository<User>,
//   ) {}

//   // GET /admin/users — list all users (password excluded)
//   async getAllUsers(): Promise<Omit<User, 'password'>[]> {
//     const users = await this.userRepo.find();
//     return users.map(({ password, ...rest }) => rest as Omit<User, 'password'>);
//   }

//   // GET /admin/users/:id — get single user
//   async getUserById(id: number): Promise<Omit<User, 'password'>> {
//     const user = await this.userRepo.findOne({ where: { id } });
//     if (!user) throw new NotFoundException(`User #${id} not found`);
//     const { password, ...rest } = user;
//     return rest as Omit<User, 'password'>;
//   }

//   // PATCH /admin/users/:id/role — change a user's role
//   async updateUserRole(id: number, role: Role): Promise<{ message: string }> {
//     const user = await this.userRepo.findOne({ where: { id } });
//     if (!user) throw new NotFoundException(`User #${id} not found`);
//     user.role = role;
//     await this.userRepo.save(user);
//     return { message: `User #${id} role updated to ${role}` };
//   }

//   // DELETE /admin/users/:id — delete a user
//   async deleteUser(id: number): Promise<{ message: string }> {
//     const user = await this.userRepo.findOne({ where: { id } });
//     if (!user) throw new NotFoundException(`User #${id} not found`);
//     await this.userRepo.remove(user);
//     return { message: `User #${id} deleted successfully` };
//   }
// }
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ActivityLogService, GetLogsOptions } from 'src/activity-log/activity-log.service';
import { User } from 'src/auth/entities/user.entity';
import { Role } from 'src/utils/role.emu';
import { Repository } from 'typeorm';


@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly activityLogService: ActivityLogService,
  ) { }

  async getAllUsers() {
    const users = await this.userRepo.find();
    return users.map(({ password, ...rest }) => rest);
  }

  async getUserById(id: number) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User #${id} not found`);
    const { password, ...rest } = user;
    return rest;
  }

  async updateUserRole(id: number, role: Role) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User #${id} not found`);
    user.role = role;
    await this.userRepo.save(user);
    return { message: `User #${id} role updated to ${role}` };
  }

  async deleteUser(id: number) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User #${id} not found`);
    await this.userRepo.remove(user);
    return { message: `User #${id} deleted successfully` };
  }

  // ─── Activity Logs ────────────────────────────────────────────────────────────
  async getLogs(options: GetLogsOptions) {
    return this.activityLogService.getLogs(options);
  }

  async getLogsByUser(userId: number, page: number, limit: number) {
    return this.activityLogService.getLogsByUser(userId, page, limit);
  }
}