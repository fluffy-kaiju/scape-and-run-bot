import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import * as Joi from 'joi';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        HOST: Joi.string()
          .hostname()
          .required()
          .description('Hostname of the RCON server'),
        PORT: Joi.number()
          .default(25575)
          .description('Port of the RCON server'),
        PASSWD: Joi.string()
          .required()
          .description('Password for the RCON server'),
      }),
    }),
  ],
  providers: [AppService],
})
export class AppModule {}
