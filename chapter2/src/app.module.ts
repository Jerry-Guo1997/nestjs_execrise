import { Module } from '@nestjs/common';
import { DatabaseModule } from './modules/database/database.module';
import { database } from './config/database.config';

@Module({
  imports: [DatabaseModule.forRoot(database)],
  
})
export class AppModule {}
