import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import * as sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

@Controller('convert-image')
export class ImageConversionController {
  private outputFolder = 'output'; // Folder where the converted image will be saved

  constructor() {
    // Ensure the output folder exists
    if (!fs.existsSync(this.outputFolder)) {
      fs.mkdirSync(this.outputFolder);
    }
  }

  // Function to get the next sequential filename
  private getNextFileName(folder: string): string {
    const files = fs.readdirSync(folder);
    const webpFiles = files
      .filter(file => file.startsWith('output-image-') && file.endsWith('.webp'))
      .map(file => parseInt(file.split('-')[2])); // Extract the number part

    const nextNumber = webpFiles.length > 0 ? Math.max(...webpFiles) + 1 : 1;
    return `output-image-${nextNumber}.webp`;
  }

  // Function to download image and convert it to WebP with high quality and dynamic resizing
  private async convertImageToWebp(url: string, folder: string, resizeRatio: number) {
    try {
      const response = await axios({
        url,
        responseType: 'arraybuffer',
      });

      const outputImagePath = path.join(folder, this.getNextFileName(folder));
      const image = sharp(response.data);
      const metadata = await image.metadata();

      const newWidth = Math.round(metadata.width * resizeRatio);
      const newHeight = Math.round(metadata.height * resizeRatio);

      if (metadata.format === 'png') {
        await image
          .resize(newWidth, newHeight, { fit: sharp.fit.inside })
          .webp({ lossless: true })
          .toFile(outputImagePath);
      } else if (metadata.format === 'jpeg') {
        await image
          .resize(newWidth, newHeight, { fit: sharp.fit.inside })
          .webp({ quality: 100 })
          .toFile(outputImagePath);
      } else {
        await image
          .resize(newWidth, newHeight, { fit: sharp.fit.inside })
          .webp({ quality: 100 })
          .toFile(outputImagePath);
      }

      return { 
        process: true, 
        message: 'Image converted successfully', 
        path: outputImagePath, 
        dimensions: { width: newWidth, height: newHeight } // Return dimensions
      };
    } catch (error) {
      throw new HttpException('Error converting image: ' + error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post()
  async convertImage(@Body() body: { imageUrl: string; resizeRatio: number }) {
    const { imageUrl, resizeRatio } = body;

    if (!imageUrl || !resizeRatio) {
      throw new HttpException('imageUrl and resizeRatio are required.', HttpStatus.BAD_REQUEST);
    }

    // Call the convertImageToWebp function
    const result = await this.convertImageToWebp(imageUrl, this.outputFolder, resizeRatio);

    if (result.process) {
      return { 
        process: true, 
        message: result.message, 
        path: result.path, 
        dimensions: result.dimensions 
      };
    }
  }
}
