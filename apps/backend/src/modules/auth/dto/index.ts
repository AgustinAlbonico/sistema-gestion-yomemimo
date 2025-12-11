import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';
import {
    IsString,
    IsNotEmpty,
    MinLength,
    MaxLength,
    IsEmail,
    IsOptional,
    Matches,
    IsBoolean,
} from 'class-validator';

// ==================== LOGIN ====================
export const LoginSchema = z.object({
    username: z.string().min(1, 'El nombre de usuario es requerido'),
    password: z.string().min(1, 'La contraseña es requerida'),
});

export type LoginDTO = z.infer<typeof LoginSchema>;

export class LoginDto implements LoginDTO {
    @ApiProperty({ example: 'admin' })
    @IsString()
    @IsNotEmpty({ message: 'El nombre de usuario es requerido' })
    username!: string;

    @ApiProperty({ example: 'password123' })
    @IsString()
    @IsNotEmpty({ message: 'La contraseña es requerida' })
    password!: string;
}

export class LoginResponseDto {
    @ApiProperty()
    accessToken!: string;

    @ApiProperty()
    refreshToken!: string;

    @ApiProperty()
    user!: {
        id: string;
        username: string;
        email?: string | null;
        firstName: string;
        lastName: string;
    };
}

// ==================== REGISTER ====================
export const RegisterSchema = z.object({
    username: z.string().min(3, 'El nombre de usuario debe tener al menos 3 caracteres').max(50),
    email: z.string().email('Email inválido').optional().nullable(),
    password: z
        .string()
        .min(8, 'La contraseña debe tener al menos 8 caracteres')
        .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
        .regex(/[a-z]/, 'Debe contener al menos una minúscula')
        .regex(/[0-9]/, 'Debe contener al menos un número'),
    firstName: z.string().min(1, 'El nombre es requerido').max(100),
    lastName: z.string().min(1, 'El apellido es requerido').max(100),
});

export type RegisterDTO = z.infer<typeof RegisterSchema>;

export class RegisterDto implements RegisterDTO {
    @ApiProperty({ example: 'usuario123' })
    @IsString()
    @MinLength(3, { message: 'El nombre de usuario debe tener al menos 3 caracteres' })
    @MaxLength(50)
    username!: string;

    @ApiProperty({ example: 'user@example.com', required: false })
    @IsOptional()
    @IsEmail({}, { message: 'Email inválido' })
    email?: string | null;

    @ApiProperty({ example: 'Password123' })
    @IsString()
    @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
    @Matches(/[A-Z]/, { message: 'Debe contener al menos una mayúscula' })
    @Matches(/[a-z]/, { message: 'Debe contener al menos una minúscula' })
    @Matches(/[0-9]/, { message: 'Debe contener al menos un número' })
    password!: string;

    @ApiProperty({ example: 'Juan' })
    @IsString()
    @IsNotEmpty({ message: 'El nombre es requerido' })
    @MaxLength(100)
    firstName!: string;

    @ApiProperty({ example: 'Pérez' })
    @IsString()
    @IsNotEmpty({ message: 'El apellido es requerido' })
    @MaxLength(100)
    lastName!: string;
}

// ==================== REFRESH TOKEN ====================
export const RefreshTokenSchema = z.object({
    refreshToken: z.string().min(1, 'El refresh token es requerido'),
});

export type RefreshTokenDTO = z.infer<typeof RefreshTokenSchema>;

export class RefreshTokenDto implements RefreshTokenDTO {
    @ApiProperty()
    @IsString()
    @IsNotEmpty({ message: 'El refresh token es requerido' })
    refreshToken!: string;
}

// ==================== CHANGE PASSWORD ====================
export const ChangePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
    newPassword: z
        .string()
        .min(8, 'La contraseña debe tener al menos 8 caracteres')
        .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
        .regex(/[a-z]/, 'Debe contener al menos una minúscula')
        .regex(/[0-9]/, 'Debe contener al menos un número'),
});

export type ChangePasswordDTO = z.infer<typeof ChangePasswordSchema>;

export class ChangePasswordDto implements ChangePasswordDTO {
    @ApiProperty()
    @IsString()
    @IsNotEmpty({ message: 'La contraseña actual es requerida' })
    currentPassword!: string;

    @ApiProperty()
    @IsString()
    @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
    @Matches(/[A-Z]/, { message: 'Debe contener al menos una mayúscula' })
    @Matches(/[a-z]/, { message: 'Debe contener al menos una minúscula' })
    @Matches(/[0-9]/, { message: 'Debe contener al menos un número' })
    newPassword!: string;
}

// ==================== CREATE USER ====================
export const CreateUserSchema = z.object({
    username: z
        .string()
        .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
        .max(50, 'El nombre de usuario no puede exceder 50 caracteres')
        .regex(/^[a-z0-9]+$/, 'El nombre de usuario debe estar en minúsculas, sin espacios ni caracteres especiales')
        .refine((val) => !val.includes(' '), 'El nombre de usuario no puede contener espacios'),
    email: z.string().email().optional().nullable(),
    password: z
        .string()
        .min(8, 'La contraseña debe tener al menos 8 caracteres')
        .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
        .regex(/[a-z]/, 'Debe contener al menos una minúscula')
        .regex(/[0-9]/, 'Debe contener al menos un número'),
    firstName: z.string().min(1, 'El nombre es requerido').max(100),
    lastName: z.string().min(1, 'El apellido es requerido').max(100),
    isActive: z.boolean().default(true),
});

export type CreateUserDTO = z.infer<typeof CreateUserSchema>;

export class CreateUserDto implements CreateUserDTO {
    @ApiProperty({ example: 'usuario123' })
    @IsString()
    @MinLength(3)
    @MaxLength(50)
    username!: string;

    @ApiProperty({ example: 'user@example.com', required: false })
    @IsOptional()
    @IsEmail()
    email?: string | null;

    @ApiProperty({ example: 'Password123' })
    @IsString()
    @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
    @Matches(/[A-Z]/, { message: 'Debe contener al menos una mayúscula' })
    @Matches(/[a-z]/, { message: 'Debe contener al menos una minúscula' })
    @Matches(/[0-9]/, { message: 'Debe contener al menos un número' })
    password!: string;

    @ApiProperty({ example: 'Juan' })
    @IsString()
    @IsNotEmpty({ message: 'El nombre es requerido' })
    @MaxLength(100)
    firstName!: string;

    @ApiProperty({ example: 'Pérez' })
    @IsString()
    @IsNotEmpty({ message: 'El apellido es requerido' })
    @MaxLength(100)
    lastName!: string;

    @ApiProperty({ default: true })
    @IsBoolean()
    @IsOptional()
    isActive!: boolean;
}

// ==================== UPDATE USER ====================
export const UpdateUserSchema = CreateUserSchema.partial().omit({ password: true });

export type UpdateUserDTO = z.infer<typeof UpdateUserSchema>;

export class UpdateUserDto {
    @ApiProperty({ example: 'usuario123', required: false })
    @IsOptional()
    @IsString()
    @MinLength(3)
    @MaxLength(50)
    username?: string;

    @ApiProperty({ example: 'user@example.com', required: false })
    @IsOptional()
    @IsEmail()
    email?: string | null;

    @ApiProperty({ example: 'Juan', required: false })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    firstName?: string;

    @ApiProperty({ example: 'Pérez', required: false })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    lastName?: string;

    @ApiProperty({ default: true, required: false })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

// ==================== UPDATE PROFILE ====================
export const UpdateProfileSchema = z.object({
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().min(1).max(100).optional(),
    email: z.string().email().optional().nullable(),
});

export type UpdateProfileDTO = z.infer<typeof UpdateProfileSchema>;

export class UpdateProfileDto implements UpdateProfileDTO {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    firstName?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    lastName?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsEmail()
    email?: string | null;
}
