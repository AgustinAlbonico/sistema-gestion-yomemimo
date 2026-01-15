/**
 * Setup global para todos los tests
 */

// Silenciar logs en tests
jest.spyOn(console, 'log').mockImplementation(() => { });
jest.spyOn(console, 'debug').mockImplementation(() => { });

// Mock de Date.now() para tests determinísticos
const FIXED_DATE = new Date('2026-01-15T10:00:00Z');

beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(FIXED_DATE);
});

afterAll(() => {
    jest.useRealTimers();
});

// Limpiar mocks entre tests
afterEach(() => {
    jest.clearAllMocks();
});
