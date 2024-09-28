import { Module } from '@nestjs/common';
import { ImageConversionController } from './image-conversion.controller';

@Module({
  controllers: [ImageConversionController],
})
export class ImageConversionModule {}
