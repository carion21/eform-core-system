import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { TeamModule } from './team/team.module';
import { KpiModule } from './kpi/kpi.module';
import { ProjectModule } from './project/project.module';
import { FieldTypeModule } from './field-type/field-type.module';
import { FormModule } from './form/form.module';
import { StoreModule } from './store/store.module';
import { StatisticsModule } from './statistics/statistics.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UserModule,
    TeamModule,
    KpiModule,
    ProjectModule,
    FieldTypeModule,
    FormModule,
    StoreModule,
    StatisticsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
