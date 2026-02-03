import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import * as nodemailer from 'nodemailer';
import { QUEUES } from '../queue.constants';

export interface EmailJobData {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer;
    contentType?: string;
  }>;
}

@Injectable()
@Processor(QUEUES.EMAIL)
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly configService: ConfigService) {
    super();
    this.initializeTransporter();
  }

  private initializeTransporter(): void {
    const host = this.configService.get('SMTP_HOST');
    const port = this.configService.get('SMTP_PORT');
    const user = this.configService.get('SMTP_USER');
    const pass = this.configService.get('SMTP_PASS');

    if (host && port && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: parseInt(port),
        secure: port === '465',
        auth: { user, pass },
      });
      this.logger.log('✅ Email transporter initialized');
    } else {
      this.logger.warn('⚠️ SMTP not configured - emails will be logged only');
    }
  }

  async process(job: Job<EmailJobData>): Promise<void> {
    const { to, subject, html, text, cc, bcc, attachments } = job.data;

    this.logger.log(`📧 Processing email: ${subject} to ${Array.isArray(to) ? to.join(', ') : to}`);

    if (!this.transporter) {
      this.logger.warn(`Email would be sent to ${to}: ${subject}`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.configService.get('SMTP_FROM', 'noreply@parnamirim.rn.gov.br'),
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        html,
        text,
        cc: cc?.join(', '),
        bcc: bcc?.join(', '),
        attachments,
      });

      this.logger.log(`✅ Email sent successfully to ${to}`);
    } catch (error: any) {
      this.logger.error(`Error sending email: ${error.message}`);
      throw error;
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<EmailJobData>) {
    this.logger.log(`✅ Email job ${job.id} completed: ${job.data.subject}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<EmailJobData>, error: Error) {
    this.logger.error(`❌ Email job ${job.id} failed: ${error.message}`);
  }
}
