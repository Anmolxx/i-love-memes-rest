import 'dotenv/config';
import {
  ClassSerializerInterceptor,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { useContainer } from 'class-validator';
import { AllExceptionsFilter } from './utils/filters';
import { AppModule } from './app.module';
import { AllConfigType } from './config/config.type';
import { ResolvePromisesInterceptor } from './utils/serializer.interceptor';
import validationOptions from './utils/validation-options';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // obtain configService early so we can configure CORS from env/config
  const configService = app.get(ConfigService<AllConfigType>);

  // Read allowed origins from config or env; fallback to true (reflect origin)
  const rawOrigins =
    configService.get<string>('app.corsOrigins', { infer: true }) ||
    process.env.CORS_ORIGINS ||
    '';

  const allowedOrigins = rawOrigins
    ? rawOrigins.split(',').map((s) => s.trim())
    : null; // null => allow reflection of origin (origin: true)

  app.enableCors({
    origin: (origin, callback) => {
      // allow non-browser requests like curl/postman (no origin)
      if (!origin) return callback(null, true);
      if (!allowedOrigins) return callback(null, true); // reflect origin
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      process.env.APP_HEADER_LANGUAGE || 'x-custom-lang',
    ],
    // don't continue to the route handler for preflight requests; respond here
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  app.enableShutdownHooks();
  app.setGlobalPrefix(
    configService.getOrThrow('app.apiPrefix', { infer: true }),
    {
      exclude: ['/'],
    },
  );
  app.enableVersioning({
    type: VersioningType.URI,
  });
  app.useGlobalPipes(new ValidationPipe(validationOptions));
  app.useGlobalInterceptors(
    // ResolvePromisesInterceptor is used to resolve promises in responses because class-transformer can't do it
    // https://github.com/typestack/class-transformer/issues/549
    new ResolvePromisesInterceptor(),
    new ClassSerializerInterceptor(app.get(Reflector)),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  const options = new DocumentBuilder()
    .setTitle('I Love Memes API')
    .setDescription('I Love Memes Docs')
    .setVersion('1.0.0-rc7')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'Authorization',
      description: 'JWT Bearer token for authenticated requests',
      in: 'header',
    })
    .addGlobalParameters({
      in: 'header',
      required: false,
      name: process.env.APP_HEADER_LANGUAGE || 'x-custom-lang',
      schema: {
        example: 'en',
      },
    })
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('/api/docs', app, document);

  await app.listen(configService.getOrThrow('app.port', { infer: true }));
}
void bootstrap();
