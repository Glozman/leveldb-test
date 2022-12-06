import { GeoService } from './geo.service';
import { GeoController } from './geo.controller';
import { HttpModule } from '@nestjs/axios';
import { CacheModule, Module } from '@nestjs/common';
import * as redisStore from 'cache-manager-redis-store';
@Module({
  imports: [
    HttpModule,
    CacheModule.register({
      store: redisStore,
      host: 'localhost',
      port: 6379,
      isGlobal: true,
    }),
  ],
  controllers: [GeoController],
  providers: [GeoService],
})
export class GeoModule {}
