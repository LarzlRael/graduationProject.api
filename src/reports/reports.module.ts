import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import {
  databasePoolFactory,
  ConfigService,
  ConfigModule,
} from 'src/databasePool';
@Module({
  imports: [ConfigModule.forRoot()],

  providers: [
    ReportsService,
    {
      provide: 'DATABASE_POOL',
      inject: [ConfigService],
      useFactory: databasePoolFactory,
    },
  ],
  controllers: [ReportsController],
})
export class ReportsModule { }
