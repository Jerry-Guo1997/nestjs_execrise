import { NestFactory } from '@nestjs/core';

import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';

import { AppModule } from './app.module';
import { useContainer } from 'class-validator';

async function bootstrap() {
    const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());

    useContainer(app.select(AppModule), {
        fallbackOnErrors: true,
    });
    // 允许跨域
    app.enableCors();
    await app.listen(3000);
}
bootstrap();
