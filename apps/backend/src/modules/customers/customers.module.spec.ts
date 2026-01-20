/**
 * Tests unitarios para CustomersModule
 * Verifica: Configuración correcta del módulo
 */
describe('CustomersModule', () => {
    it('debe tener el módulo definido', async () => {
        const { CustomersModule } = await import('./customers.module');
        expect(CustomersModule).toBeDefined();
    });

    it('debe poder importar el módulo', async () => {
        const { CustomersModule } = await import('./customers.module');
        expect(CustomersModule.name).toBe('CustomersModule');
    });
});
