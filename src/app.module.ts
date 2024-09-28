import { Module } from '@nestjs/common';
import { ImageConversionModule } from './image-conversion/image-conversion.module';

@Module({
  imports: [ImageConversionModule],
})
export class AppModule {}
