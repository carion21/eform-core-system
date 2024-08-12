import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { TeamModule } from './team/team.module';
import { ProjectModule } from './project/project.module';
import { FormModule } from './form/form.module';
import { StoreModule } from './store/store.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, AuthModule, UserModule, TeamModule, ProjectModule, FormModule, StoreModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
