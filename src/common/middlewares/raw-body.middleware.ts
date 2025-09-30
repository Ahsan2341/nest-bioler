import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RawBodyMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    console.log('RawBodyMiddleware: Request received for', req.originalUrl);

    const chunks: Buffer[] = [];

    req.on('data', (chunk: Buffer) => {
      console.log('RawBodyMiddleware: Received chunk of size', chunk.length);
      chunks.push(chunk);
    });

    req.on('end', () => {
      console.log('RawBodyMiddleware: Request body fully received');
      const rawBody = Buffer.concat(chunks);
      (req as any).rawBody = rawBody;
      console.log('RawBodyMiddleware: rawBody length', rawBody.length);
      next();
    });

    req.on('error', (err) => {
      console.error('RawBodyMiddleware: Error reading request body', err.message);
      next(err); // Pass the error to the error handler
    });
  }
}