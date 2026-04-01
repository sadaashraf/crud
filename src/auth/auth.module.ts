import { Module } from "@nestjs/common";
import { User } from "./entities/user.entity";
import { TypeOrmModule } from "@nestjs/typeorm/dist/typeorm.module";
import { AuthService } from "./auth.services";
import { AuthController } from "./auth.controller";
import { JwtModule } from "@nestjs/jwt/dist/jwt.module";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { JwtStrategy } from "./strategies/strategy";

@Module({
  imports: [TypeOrmModule.forFeature([User]),
  JwtModule.registerAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => ({
      secret: configService.get<string>('JWT_SECRET'),
      signOptions: { expiresIn: configService.get<number>('JWT_EXPIRES_IN') }
    })
  })],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule { }