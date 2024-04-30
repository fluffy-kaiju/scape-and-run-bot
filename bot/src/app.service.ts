import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Rcon } from 'rcon-client';

interface IPhase {
  currentPhase: number;
  totalPoints: number;
  pointRequiredForTheNextPhase: number;
  phaseCooldown: number;
  currentParasiteMob: number;
  progress: number;
}

@Injectable()
export class AppService implements OnModuleInit {
  private readonly log = new Logger(AppService.name);

  private client;

  async onModuleInit() {
    this.log.debug('Try to connect to the RCON');
    this.client = await Rcon.connect({
      host: '10.0.1.11',
      password: 'TheBigBigThiccPasswordOfYourMother',
    });
    await this.tell('Bot connected!');
  }

  getHello(): string {
    return 'Hello World!';
  }

  private async tell(msg: string, displayName: string = 'SaRP_Bot') {
    const command =
      '/tellraw @a ' + JSON.stringify({ text: `[${displayName}]: ${msg}` });

    this.log.verbose(`Executing ${command}`);
    return await this.client.send(command);
  }

  private timeout;
  private interval = 1000 * 5;

  /**
   * {
   * 'Current Evolution Phase': '1',
   * 'Total points': '776',
   * 'Points required for the next phase': '800',
   * Progress: '97.0%',
   * 'Phase cooldown': '207 second(s) remaining',
   * srpevolutiongaining: 'true (can gain points)',
   * srpevolutionloss: 'false (cannot lose points)',
   * 'Current Parasite Mob Cap': '80',
   * 'Number of current parasites': '87'
   * }
   * @returns
   */
  async getPhases(): Promise<IPhase> {
    const getPhasesRes: string = await this.client.send(
      '/srpevolution getphase',
    );
    this.log.verbose(getPhasesRes);
    const pattern: RegExp = /->\s*(.*?):\s*(.*)/g;
    const data: { [key: string]: string } = {};
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(getPhasesRes)) !== null) {
      const [, key, value] = match;
      data[key.trim()] = value.trim();
    }

    this.log.verbose(data);

    const res: IPhase = {
      totalPoints: parseInt(data['Total points']),
      pointRequiredForTheNextPhase: parseInt(
        data['Points required for the next phase'],
      ),
      phaseCooldown: parseInt(data['Phase cooldown']),
      currentParasiteMob: parseInt(data['Number of current parasites']),
      currentPhase: parseInt(data['Current Evolution Phase']),
      progress: parseInt(data['Progress']),
    };

    return res;
  }

  async checkStatus() {
    // const phases = await this.getPhases();
  }

  private phase: IPhase;
  //TODO #1
  /**
   * Make multiple job queue for each phase data
   * like:
   * - checkLeftCooldown({
   *  s: 5 * 60,
   *  message: `5 minutes lef befor cooldown!`,
   * })
   * - checkProgression({
   *    percent: 80,
   *    message: `Phase progression at 80 percent!!!`,
   * })
   */
  private checkxMinJobs = new Map<number, boolean>();
  private lastLvl: number = 0;

  private checkXMin() {
    this.checkxMinJobs.forEach((skip, min) => {
      if (skip) {
        return;
      }
      this.log.debug(skip);
      this.log.debug(min);
      if (this.phase.phaseCooldown < min * 60) {
        this.tell(`Left less than ${this.phase.phaseCooldown}s of cooldown!`);
        this.tell(`Current phase: ${this.phase.currentPhase}`);
        this.tell(`Progress     : ${this.phase.progress}%`);

        this.checkxMinJobs.set(min, true);
      }
    });
  }

  private setCheckXMinCooldown(min: number) {
    this.checkxMinJobs.set(min, false);
  }

  async start() {
    this.setCheckXMinCooldown(1);
    this.setCheckXMinCooldown(3);
    this.setCheckXMinCooldown(5);
    this.setCheckXMinCooldown(10);
    this.setCheckXMinCooldown(16);

    this.timeout = setInterval(async () => {
      this.log.verbose('Starting phase check');
      this.phase = await this.getPhases();
      if (this.lastLvl !== this.phase.currentPhase) {
        this.log.debug(
          `Lvl as changed from ${this.lastLvl} to ${this.phase.currentPhase}`,
        );
      }

      this.checkXMin();

      this.log.debug(`Actual progress ${this.phase.progress}`);
      this.log.debug(`Actual phase ${this.phase.currentPhase}`);
      this.log.debug(`Actual cooldown ${this.phase.phaseCooldown} s`);

      this.checkxMinJobs.forEach((val, key) => {
        this.log.warn(key);
        this.log.warn(val);
      });
    }, this.interval);
  }
}
