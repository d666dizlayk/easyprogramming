import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuditEvent } from "./audit.entity";
import { AuditService } from "./audit.service";

@Module({
  imports: [TypeOrmModule.forFeature([AuditEvent])],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
