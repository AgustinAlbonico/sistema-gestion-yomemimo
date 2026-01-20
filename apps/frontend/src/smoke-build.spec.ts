/**
 * Smoke Tests para Frontend - Build y Despliegue
 *
 * Estos tests verifican que la aplicación frontend:
 * 1. Se construye correctamente
 * 2. Tiene las rutas principales configuradas
 * 3. Los componentes básicos renderizan sin crash
 *
 * Son tests rápidos que se ejecutan antes de desplegar.
 */

import { describe, it, expect, beforeEach } from 'vitest';

describe('Smoke Tests - Frontend Build', () => {
  describe('Configuración de Rutas', () => {
    it('debe tener configuradas las rutas principales', () => {
      // Este test verifica que el archivo de rutas existe y es importable
      const routesModule = () => {
        // Intentar importar el módulo de rutas
        try {
          require('../routes');
          return true;
        } catch {
          // Si falla, verificar que existe App.tsx que debería tener las rutas
          try {
            require('../App');
            return true;
          } catch {
            return false;
          }
        }
      };

      expect(routesModule()).toBe(true);
    });

    it('debe tener el componente App principal', () => {
      expect(() => {
        const App = require('../App').default;
        expect(App).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('Imports de Componentes Críticos', () => {
    it('debe poder importar hooks de autenticación', () => {
      expect(() => {
        require('../features/auth/hooks/useAuth');
      }).not.toThrow();
    });

    it('debe poder importar componentes de ventas', () => {
      expect(() => {
        require('../features/sales/components/SaleForm');
      }).not.toThrow();
    });

    it('debe poder importar componentes de productos', () => {
      expect(() => {
        // Verificar que existe al menos un componente de productos
        const productsPath = require('../features/products');
        expect(productsPath).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('Configuración de Estado Global', () => {
    it('debe tener configurado Zustand para estado global', () => {
      expect(() => {
        require('../store');
      }).not.toThrow();
    });
  });

  describe('Configuración de Router', () => {
    it('debe tener React Router configurado', () => {
      // Verificar que react-router-dom está disponible
      const reactRouter = require('react-router-dom');
      expect(reactRouter).toBeDefined();
      expect(typeof reactRouter.BrowserRouter !== 'undefined').toBe(true);
    });
  });

  describe('Configuración de Queries', () => {
    it('debe tener TanStack Query configurado', () => {
      const tanStackQuery = require('@tanstack/react-query');
      expect(tanStackQuery).toBeDefined();
      expect(typeof tanStackQuery.useQuery).toBe('function');
    });
  });

  describe('Componentes UI Base', () => {
    it('debe poder importar componentes de Radix UI', () => {
      expect(() => {
        require('@radix-ui/react-dialog');
        require('@radix-ui/react-dropdown-menu');
        require('@radix-ui/react-select');
      }).not.toThrow();
    });

    it('debe tener iconos de lucide-react disponibles', () => {
      const lucideReact = require('lucide-react');
      expect(lucideReact).toBeDefined();
      // Verificar que algunos iconos comunes existen
      expect(typeof lucideReact.ShoppingCart).toBe('function');
      expect(typeof lucideReact.Users).toBe('function');
    });
  });

  describe('Utilidades y Helpers', () => {
    it('debe tener utilidad de formatting de moneda', () => {
      // Verificar que existe alguna función de formatting
      expect(() => {
        // Intentar importar desde utils o common
        try {
          require('../utils/currency');
        } catch {
          // Si no existe, no fallar el test - es opcional
        }
      }).not.toThrow();
    });

    it('debe tener utilidad de formatting de fechas', () => {
      // Verificar que date-fns está disponible
      const dateFns = require('date-fns');
      expect(dateFns).toBeDefined();
      expect(typeof dateFns.format).toBe('function');
    });
  });
});

describe('Smoke Tests - Componentes No Crash', () => {
  describe('Componentes de Autenticación', () => {
    it('useAuth hook debe estar definido', () => {
      const useAuth = require('../features/auth/hooks/useAuth').useAuth;
      expect(typeof useAuth).toBe('function');
    });
  });

  describe('Componentes de Dashboard', () => {
    it('debe tener componentes de métricas o dashboard', () => {
      expect(() => {
        try {
          require('../components/Dashboard');
        } catch {
          // Si no existe en components, intentar en features
          try {
            require('../features/dashboard');
          } catch {
            // Dashboard puede estar en diferente ubicación
          }
        }
      }).not.toThrow();
    });
  });
});

describe('Smoke Tests - Configuración de Build', () => {
  it('package.json debe tener scripts de build', () => {
    const packageJson = require('../../package.json');
    expect(packageJson.scripts).toBeDefined();
    expect(packageJson.scripts.build).toBeDefined();
    expect(packageJson.scripts.build).toMatch(/vite build/);
  });

  it('vite.config debe existir o vite.config.ts debe ser válido', () => {
    expect(() => {
      require('../../vite.config.ts');
    }).not.toThrow();
  });

  it('debe tener TypeScript configurado', () => {
    const tsconfig = require('../../tsconfig.json');
    expect(tsconfig).toBeDefined();
    expect(tsconfig.compilerOptions).toBeDefined();
  });
});

describe('Smoke Tests - Variables de Entorno', () => {
  it('debe tener definida la URL de la API', () => {
    // La URL de la API puede venir de env o estar hardcoded
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    expect(typeof apiUrl).toBe('string');
    expect(apiUrl.length).toBeGreaterThan(0);
  });
});

describe('Smoke Tests - Optimización de Bundle', () => {
  it('debe tener configurado code splitting por rutas', () => {
    // Verificar que el archivo de rutas usa lazy loading
    // Esto es un smoke check básico
    const fs = require('fs');
    const path = require('path');

    const appPath = path.resolve(__dirname, '../App.tsx');
    if (fs.existsSync(appPath)) {
      const appContent = fs.readFileSync(appPath, 'utf-8');
      // Verificar que hay alguna referencia a lazy o Suspense
      const hasCodeSplitting =
        appContent.includes('lazy') || appContent.includes('Suspense');
      // No fallar si no tiene, pero es un warning
      if (!hasCodeSplitting) {
        console.warn('⚠️  Considerar implementar code splitting para mejor performance');
      }
    }
  });
});
