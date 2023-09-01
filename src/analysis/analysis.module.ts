import { Module } from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { AnalysisController } from './analysis.controller';
import {
  databasePoolFactory,
  ConfigService,
  ConfigModule,
} from 'src/databasePool';

@Module({
  imports: [ConfigModule.forRoot()],
  providers: [
    AnalysisService,
    {
      provide: 'DATABASE_POOL',
      inject: [ConfigService],
      useFactory: databasePoolFactory,
    },
  ],
  controllers: [AnalysisController],
})
export class AnalysisModule { }
