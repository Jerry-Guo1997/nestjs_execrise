import { TypeOrmModuleOptions } from '@nestjs/typeorm';
/**
 * 数据库配置
 */
export const database = (): TypeOrmModuleOptions => ({
    charset: 'utf8',
    logging: ['error'],
    type: 'mysql',
    host: '127.0.0.1',
    port: 3309,
    username: 'root',
    password: 'root',
    database: 'demo',
    synchronize: true,
    autoLoadEntities: true,
});
