import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Rcon } from 'rcon-client';

// interface IPhase {
//   totalPoints: number;
//   pointRequiredForTheNextPhase: number;
//   phaseCooldown: number;
//   currentParasiteMob: number;
// }

@Injectable()
export class AppService implements OnModuleInit {
  log = new Logger(AppService.name);

  private client;

  async onModuleInit() {
    this.log.debug('Try to connect to the RCON');
    this.client = await Rcon.connect({
      host: '',
      password: '',
    });
    this.log.debug(await this.client.send('list'));
  }

  getHello(): string {
    return 'Hello World!';
  }

  private timeout;
  private interval = 1000 * 5;

  //   async getPhases(): Promise<IPhase> {}

  //   async checkStatus() {
  //     const phases = await this.getPhases();
  //   }

  async start() {
    this.timeout = setInterval(() => {
      this.log.debug(`Loop every ${this.interval / 1000}s`);
    }, this.interval);
  }
}
