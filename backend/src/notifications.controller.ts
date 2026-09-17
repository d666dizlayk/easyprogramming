import { Controller, Get, Patch, Param, ParseIntPipe, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "./auth/jwt-auth.guard";
import { NotificationsService } from "./notifications.service";

@UseGuards(JwtAuthGuard)
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@Req() req: any) { return this.notifications.listForUser(Number(req.user?.id ?? req.user?.sub)); }

  @Get("unread-count")
  count(@Req() req: any) { return this.notifications.unreadCount(Number(req.user?.id ?? req.user?.sub)); }

  @Patch(":id/read")
  read(@Req() req: any, @Param("id", ParseIntPipe) id: number) { return this.notifications.markRead(Number(req.user?.id ?? req.user?.sub), id); }

  @Patch("read-all")
  readAll(@Req() req: any) { return this.notifications.markAllRead(Number(req.user?.id ?? req.user?.sub)); }
}
