import type { Config } from 'jest';

const config: Config = {
    // Configuración base
    preset: 'ts-jest',
    testEnvironment: 'node',
    rootDir: '.',

    // Archivos de test
    testMatch: [
        '<rootDir>/src/**/*.spec.ts',           // Unit tests junto al código
        '<rootDir>/test/**/*.spec.ts',          // Integration/API tests
    ],

    // Exclusiones
    testPathIgnorePatterns: [
        '/node_modules/',
        '/dist/',
    ],

    // Módulos
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },

    // Coverage
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.spec.ts',
        '!src/**/*.dto.ts',
        '!src/**/*.entity.ts',
        '!src/main.ts',
        '!src/migrations/**',
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    coverageThreshold: {
        global: {
            branches: 60,
            functions: 70,
            lines: 70,
            statements: 70,
        },
    },

    // Setup
    setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],

    // Timeouts
    testTimeout: 30000,

    // Workers limitado para evitar problemas de memoria
    maxWorkers: 2,

    // Verbose output
    verbose: true,

    // Proyectos separados por tipo de test
    projects: [
        {
            displayName: 'unit',
            preset: 'ts-jest',
            testMatch: ['<rootDir>/src/**/*.spec.ts'],
            testEnvironment: 'node',
            moduleNameMapper: {
                '^@/(.*)$': '<rootDir>/src/$1',
            },
            setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
        },
        {
            displayName: 'integration',
            preset: 'ts-jest',
            testMatch: ['<rootDir>/test/integration/**/*.spec.ts'],
            testEnvironment: 'node',
            moduleNameMapper: {
                '^@/(.*)$': '<rootDir>/src/$1',
            },
            setupFilesAfterEnv: ['<rootDir>/test/setup-integration.ts'],
        },
        {
            displayName: 'api',
            preset: 'ts-jest',
            testMatch: ['<rootDir>/test/api/**/*.spec.ts'],
            testEnvironment: 'node',
            moduleNameMapper: {
                '^@/(.*)$': '<rootDir>/src/$1',
            },
            setupFilesAfterEnv: ['<rootDir>/test/setup-api.ts'],
        },
    ],
};

export default config;
