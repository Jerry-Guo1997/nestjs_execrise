import { Module } from '@nestjs/common';
import { DatabaseModule } from './modules/database/database.module';
import { database } from './config/database.config';
import { ContentModule } from './modules/content/content.module';

@Module({
  imports: [DatabaseModule.forRoot(database), ContentModule],
})
export class AppModule {}
