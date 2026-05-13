import { Module } from '@nestjs/common';
import { WorkersModule } from '@/modules/workers/workers.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AddressesService } from './addresses.service';

@Module({
  imports: [WorkersModule],
  controllers: [UsersController],
  providers: [UsersService, AddressesService],
  exports: [UsersService, AddressesService],
})
export class UsersModule {}
