import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './modules/database/database.module';
import { database } from './config/database.config';

@Module({
  imports: [DatabaseModule.forRoot(database)],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
