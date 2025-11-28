import {
    Controller,
    Post,
    Body,
    Get,
    UseGuards,
    HttpCode,
    HttpStatus,
    Ip,
    Headers,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';

import {
    LoginDto,
    LoginResponseDto,
    RegisterDto,
    RefreshTokenDto,
    ChangePasswordDto,
} from './dto';

@ApiTags('auth')
@Controller('auth')
@UseGuards(JwtAuthGuard)
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Iniciar sesión' })
    @ApiBody({ type: LoginDto })
    @ApiResponse({
        status: 200,
        description: 'Login exitoso',
        type: LoginResponseDto,
    })
    @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
    async login(
        @Body() dto: LoginDto,
        @Headers('user-agent') userAgent: string,
    ): Promise<LoginResponseDto> {
        return this.authService.login(dto, userAgent);
    }

    @Public()
    @Post('register')
    @ApiOperation({ summary: 'Registrar nuevo usuario' })
    @ApiBody({ type: RegisterDto })
    @ApiResponse({ status: 201, description: 'Usuario registrado exitosamente' })
    @ApiResponse({ status: 409, description: 'El email ya está registrado' })
    async register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    @Public()
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Refrescar access token' })
    @ApiBody({ type: RefreshTokenDto })
    @ApiResponse({
        status: 200,
        description: 'Token refrescado exitosamente',
    })
    @ApiResponse({
        status: 401,
        description: 'Refresh token inválido o expirado',
    })
    async refresh(@Body() dto: RefreshTokenDto) {
        return this.authService.refreshToken(dto.refreshToken);
    }

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Cerrar sesión' })
    @ApiResponse({ status: 200, description: 'Logout exitoso' })
    async logout(
        @CurrentUser() user: { userId: string },
        @Body() body?: { refreshToken?: string },
    ) {
        return this.authService.logout(user.userId, body?.refreshToken);
    }

    @Get('profile')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
    @ApiResponse({ status: 200, description: 'Perfil del usuario' })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    async getProfile(@CurrentUser() user: { userId: string }) {
        return this.authService.getProfile(user.userId);
    }

    @Post('change-password')
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Cambiar contraseña' })
    @ApiBody({ type: ChangePasswordDto })
    @ApiResponse({ status: 200, description: 'Contraseña cambiada exitosamente' })
    @ApiResponse({ status: 401, description: 'Contraseña actual incorrecta' })
    async changePassword(
        @CurrentUser() user: { userId: string },
        @Body() dto: ChangePasswordDto,
    ) {
        return this.authService.changePassword(user.userId, dto);
    }
}
