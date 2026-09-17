import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from "./users/users.module";
import { User } from './users/user.entity';
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "path";
import { TasksModule } from './tasks/tasks.module';
import { SubmissionsModule } from './submissions/submissions.module';
import { AuditModule } from './audit.module';
import { AuditController } from './audit.controller';
import { NotificationsModule } from './notifications.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
    rootPath: join(__dirname, "..", "uploads"),
    serveRoot: "/uploads",
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 5432),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE || 'sitedb',
      synchronize: process.env.DB_SYNCHRONIZE === 'true',
      autoLoadEntities: true,
    }),
    AuthModule,
    UsersModule,
    TasksModule,
    SubmissionsModule,
    AuditModule,
    NotificationsModule,
  ],
})
export class AppModule {}
