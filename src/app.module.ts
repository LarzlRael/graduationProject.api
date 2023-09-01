import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ReportsModule } from './reports/reports.module';
import { HistoryModule } from './history/history.module';
import { MapsModule } from './maps/maps.module';
import { ClassificationModule } from './classification/classification.module';
import { AnalysisModule } from './analysis/analysis.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    AuthModule,
    ReportsModule,
    HistoryModule,
    MapsModule,
    ClassificationModule,
    AnalysisModule,
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      autoLoadEntities: true,
      host: process.env.HOST,
      port: 5432,
      username: 'postgres',
      password: process.env.PASSWORD,
      database: process.env.DATABASE,
      synchronize: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'client'),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
