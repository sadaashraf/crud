import { IsEnum } from 'class-validator';
import { Role } from 'src/utils/role.emu';

export class UpdateRoleDto {
  @IsEnum(Role)
  role!: Role;
}
