import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Rcon, RconOptions } from 'rcon-client';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(private config: ConfigService) {}

  private readonly log = new Logger(AppService.name);

  private client;

  async onModuleInit() {
    const config: RconOptions = {
      host: this.config.get<string>('HOST'),
      port: this.config.get<number>('PORT'),
      password: this.config.get<string>('PASSWD'),
    };
    this.log.debug('Try to connect to the RCON');
    this.client = await Rcon.connect(config);
    await this.tell('Bot connected!');
  }

  getHello(): string {
    return 'Hello World!';
  }

  private async tell(msg: string, prefix: string = '[SaRP_Bot]: ') {
    const command =
      '/tellraw @a ' + JSON.stringify({ text: `${prefix}${msg}` });

    this.log.verbose(`Executing ${command}`);
    return await this.client.send(command);
  }

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
    // this.log.verbose(getPhasesRes);
    const pattern: RegExp = /->\s*(.*?):\s*(.*)/g;
    const data: { [key: string]: string } = {};
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(getPhasesRes)) !== null) {
      const [, key, value] = match;
      data[key.trim()] = value.trim();
    }

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

    this.log.verbose(res);
    return res;
  }

  private phase: IPhase;
  private timeout;
  private interval = 1000 * 1;

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

  //   private jobsList: IJobs<any>[];
  private isCooldown = false;
  private cooldownAlertList: { s: number; m: string; done: boolean }[] = [];
  private lastLvl: number = 0;

  setAlertRemainCooldown(
    second: number,
    message: string = `Less than ${second}s of cooldown left!`,
  ) {
    this.cooldownAlertList.push({
      s: second,
      m: message,
      done: false,
    });

    this.cooldownAlertList.sort((a, b) => {
      return b.s - a.s;
    });
  }

  private findCurrentAlert() {
    const currentAlert = this.cooldownAlertList.find((a) => {
      //   this.log.verbose(`${a.s} < ${this.phase.phaseCooldown}`);
      if (a.done) {
        return false;
      }
      return this.phase.phaseCooldown <= a.s;
    });
    this.log.verbose(
      `Try to find current alert: ${currentAlert ? JSON.stringify(currentAlert) : 'none'}`,
    );
    return currentAlert;
  }

  private checkAlertRemainCooldown() {
    if (this.phase.phaseCooldown) {
      if (!this.isCooldown) {
        this.isCooldown = true;
        this.tell(
          `New cooldown started! ${this.phase.phaseCooldown} seconds left!`,
        );
      }
    } else {
      this.isCooldown = false;
      this.cooldownAlertList.forEach((alert, index, self) => {
        self[index].done = false;
      });
      return;
    }
    const currentAlert = this.findCurrentAlert();
    if (currentAlert !== undefined) {
      currentAlert.done = true;
      this.log.error(`${currentAlert.s}s left!!! ${currentAlert.m}`);
      this.tell(currentAlert.m);
    }
  }

  private async initAlertRemainCooldown() {
    const phase = await this.getPhases();
    if (!phase.phaseCooldown) {
      this.isCooldown = false;
    } else {
      this.isCooldown = true;
    }
  }

  private lastSummaryUpdate = 0;
  private lastPhase = 0;
  private lastPoints = 0;

  async start() {
    this.setAlertRemainCooldown(300, '5 minute of cooldown left');
    this.setAlertRemainCooldown(120, '2 minute of cooldown left');
    this.setAlertRemainCooldown(60, '1 minute of cooldown left');
    this.setAlertRemainCooldown(30, '30 seconds of cooldown left!!!!!');

    this.initAlertRemainCooldown();

    //TODO move this to a job queue

    this.phase = await this.getPhases();
    this.lastPoints = this.phase.totalPoints;

    this.timeout = setInterval(async () => {
      this.log.verbose('Starting phase check');
      this.phase = await this.getPhases();

      // TODO move this to a job queue
      if (new Date().getTime() - this.lastSummaryUpdate > 1000 * 60 * 5) {
        this.lastSummaryUpdate = new Date().getTime();

        await this.tell('', '');
        await this.tell('Summary (next one in 5min):');

        await this.tell('', '');

        await this.tell(
          `Phase ${this.phase.currentPhase} - ${this.phase.progress}%`,
          '',
        );

        await this.tell(
          `Points: ${this.phase.totalPoints} / ${this.phase.pointRequiredForTheNextPhase}`,
          '',
        );
        await this.tell(
          `The last 5min : ${this.phase.totalPoints - this.lastPoints} points`,
          '',
        );

        await this.tell(`Cooldown: ${this.phase.phaseCooldown} seconds`, '');
        await this.tell(
          `Current Parasite Mob: ${this.phase.currentParasiteMob}`,
          '',
        );
        await this.tell('', '');
        await this.tell('', '');
      }

      this.log.verbose(
        `There is a cooldown ?: ${this.isCooldown}`,
        this.phase.phaseCooldown,
      );
      this.checkAlertRemainCooldown();
    }, this.interval);
  }
}

interface IPhase {
  currentPhase: number;
  totalPoints: number;
  pointRequiredForTheNextPhase: number;
  phaseCooldown: number;
  currentParasiteMob: number;
  progress: number;
}
