import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { AuthService } from './auth.service';
import { UsersService } from './users.service';
import { TokensService } from './tokens.service';
import { AuthController } from './auth.controller';
import { UsersController } from './users.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginAudit } from './entities/login-audit.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, RefreshToken, LoginAudit]),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: {
                    expiresIn: configService.get<string>('JWT_EXPIRES_IN', '30d'),
                },
            }),
        }),
    ],
    controllers: [AuthController, UsersController],
    providers: [
        AuthService,
        UsersService,
        TokensService,
        JwtStrategy,
        JwtAuthGuard,
    ],
    exports: [AuthService, UsersService, JwtAuthGuard],
})
export class AuthModule { }
