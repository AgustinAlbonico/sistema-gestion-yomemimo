import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class AppService {
  constructor(@InjectDataSource() private dataSource: DataSource) { }

  getHello() {
    return { message: 'Hello from backend' };
  }

  async getHealthCheck() {
    const dbStatus = await this.checkDatabase();

    return {
      status: dbStatus ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        api: {
          status: 'up',
        },
        database: {
          status: dbStatus ? 'up' : 'down',
        },
      },
    };
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      await this.dataSource.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}
