import { Module } from '@nestjs/common';
import { WorkersController } from './workers.controller';
import { WorkersService } from './workers.service';
import { FavoritesService } from './favorites.service';

@Module({
  controllers: [WorkersController],
  providers: [WorkersService, FavoritesService],
  exports: [WorkersService, FavoritesService],
})
export class WorkersModule {}
