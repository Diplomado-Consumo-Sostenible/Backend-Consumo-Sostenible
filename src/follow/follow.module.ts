import { Module } from '@nestjs/common';
import { FollowsController } from './controllers/follow.controller';
import { FollowsService } from './services/follow.service';

@Module({
  controllers: [FollowsController],
  providers: [FollowsService],
})
export class FollowModule {}
