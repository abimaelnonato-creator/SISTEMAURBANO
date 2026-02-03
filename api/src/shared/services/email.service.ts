import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT', 587);
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (!host || !user || !pass) {
      this.logger.warn(
        'SMTP not configured. Email sending will be disabled. Set SMTP_HOST, SMTP_USER, SMTP_PASS in environment.',
      );
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });

    // Verify connection
    this.transporter.verify((error: Error | null) => {
      if (error) {
        this.logger.error('SMTP connection failed:', error);
        this.transporter = null;
      } else {
        this.logger.log('SMTP server connected successfully');
      }
    });
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn(
        `Email not sent (SMTP not configured). To: ${options.to}, Subject: ${options.subject}`,
      );
      // In development, log the email content
      if (this.configService.get<string>('NODE_ENV') === 'development') {
        this.logger.debug(`Email content: ${options.html}`);
      }
      return false;
    }

    const from = this.configService.get<string>(
      'SMTP_FROM',
      'Sistema Gestão Urbana <noreply@parnamirim.rn.gov.br>',
    );

    try {
      await this.transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.stripHtml(options.html),
      });

      this.logger.log(`Email sent successfully to ${options.to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}:`, error);
      return false;
    }
  }

  async sendPasswordResetEmail(
    email: string,
    name: string,
    resetToken: string,
  ): Promise<boolean> {
    const baseUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:5173',
    );
    const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`;

    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recuperação de Senha</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #0a1628 0%, #1e3a5f 100%); padding: 30px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; }
    .content { padding: 40px 30px; }
    .content h2 { color: #333; margin-top: 0; }
    .content p { color: #666; line-height: 1.6; }
    .button { display: inline-block; padding: 14px 30px; background-color: #0a1628; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
    .footer { background-color: #f8f9fa; padding: 20px 30px; text-align: center; font-size: 12px; color: #999; }
    .warning { background-color: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 6px; margin-top: 20px; }
    .warning p { color: #856404; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏛️ Sistema de Gestão Urbana</h1>
      <p style="color: #ccc; margin: 10px 0 0;">Prefeitura de Parnamirim/RN</p>
    </div>
    <div class="content">
      <h2>Olá, ${name}!</h2>
      <p>Recebemos uma solicitação para redefinir a senha da sua conta no Sistema de Gestão Urbana.</p>
      <p>Clique no botão abaixo para criar uma nova senha:</p>
      <a href="${resetUrl}" class="button">Redefinir Senha</a>
      <p>Ou copie e cole este link no seu navegador:</p>
      <p style="word-break: break-all; color: #0a1628;">${resetUrl}</p>
      <div class="warning">
        <p>⚠️ Este link é válido por <strong>1 hora</strong>. Se você não solicitou esta alteração, ignore este e-mail.</p>
      </div>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Prefeitura de Parnamirim/RN - Sistema de Gestão Urbana</p>
      <p>Este é um e-mail automático, não responda.</p>
    </div>
  </div>
</body>
</html>
    `;

    return this.sendEmail({
      to: email,
      subject: '🔐 Recuperação de Senha - Sistema de Gestão Urbana',
      html,
    });
  }

  async sendDemandNotification(
    email: string,
    name: string,
    protocol: string,
    status: string,
    message: string,
  ): Promise<boolean> {
    const statusLabels: Record<string, { label: string; color: string }> = {
      OPEN: { label: 'Aberta', color: '#3b82f6' },
      IN_PROGRESS: { label: 'Em Andamento', color: '#f59e0b' },
      RESOLVED: { label: 'Resolvida', color: '#10b981' },
      ARCHIVED: { label: 'Arquivada', color: '#6b7280' },
      CANCELLED: { label: 'Cancelada', color: '#ef4444' },
    };

    const statusInfo = statusLabels[status] || {
      label: status,
      color: '#6b7280',
    };

    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Atualização da Demanda</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #0a1628 0%, #1e3a5f 100%); padding: 30px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; }
    .content { padding: 40px 30px; }
    .protocol { background-color: #f0f9ff; border: 2px solid #0ea5e9; border-radius: 8px; padding: 15px; text-align: center; margin: 20px 0; }
    .protocol span { font-size: 24px; font-weight: bold; color: #0369a1; font-family: monospace; }
    .status { display: inline-block; padding: 8px 16px; border-radius: 20px; color: #fff; font-weight: bold; }
    .footer { background-color: #f8f9fa; padding: 20px 30px; text-align: center; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏛️ Sistema de Gestão Urbana</h1>
      <p style="color: #ccc; margin: 10px 0 0;">Prefeitura de Parnamirim/RN</p>
    </div>
    <div class="content">
      <h2>Olá, ${name}!</h2>
      <p>Há uma atualização na sua demanda:</p>
      <div class="protocol">
        <p style="margin: 0 0 5px; color: #666;">Protocolo</p>
        <span>${protocol}</span>
      </div>
      <p><strong>Status:</strong> <span class="status" style="background-color: ${statusInfo.color};">${statusInfo.label}</span></p>
      <p><strong>Mensagem:</strong></p>
      <p style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; border-left: 4px solid #0a1628;">${message}</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Prefeitura de Parnamirim/RN - Sistema de Gestão Urbana</p>
      <p>Este é um e-mail automático, não responda.</p>
    </div>
  </div>
</body>
</html>
    `;

    return this.sendEmail({
      to: email,
      subject: `📋 Atualização da Demanda #${protocol} - ${statusInfo.label}`,
      html,
    });
  }

  async sendWelcomeEmail(
    email: string,
    name: string,
    tempPassword?: string,
  ): Promise<boolean> {
    const baseUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:5173',
    );

    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bem-vindo ao Sistema</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #0a1628 0%, #1e3a5f 100%); padding: 30px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; }
    .content { padding: 40px 30px; }
    .button { display: inline-block; padding: 14px 30px; background-color: #0a1628; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
    .footer { background-color: #f8f9fa; padding: 20px 30px; text-align: center; font-size: 12px; color: #999; }
    .credentials { background-color: #f0f9ff; border: 1px solid #0ea5e9; padding: 20px; border-radius: 8px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏛️ Bem-vindo ao Sistema de Gestão Urbana!</h1>
      <p style="color: #ccc; margin: 10px 0 0;">Prefeitura de Parnamirim/RN</p>
    </div>
    <div class="content">
      <h2>Olá, ${name}!</h2>
      <p>Sua conta foi criada com sucesso no Sistema de Gestão Urbana de Parnamirim/RN.</p>
      ${
        tempPassword
          ? `
      <div class="credentials">
        <p style="margin: 0 0 10px;"><strong>Suas credenciais de acesso:</strong></p>
        <p style="margin: 5px 0;">📧 <strong>E-mail:</strong> ${email}</p>
        <p style="margin: 5px 0;">🔑 <strong>Senha temporária:</strong> ${tempPassword}</p>
        <p style="margin: 15px 0 0; color: #dc2626; font-size: 14px;">⚠️ Por segurança, altere sua senha no primeiro acesso.</p>
      </div>
      `
          : ''
      }
      <a href="${baseUrl}/auth/login" class="button">Acessar o Sistema</a>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Prefeitura de Parnamirim/RN - Sistema de Gestão Urbana</p>
      <p>Este é um e-mail automático, não responda.</p>
    </div>
  </div>
</body>
</html>
    `;

    return this.sendEmail({
      to: email,
      subject: '🎉 Bem-vindo ao Sistema de Gestão Urbana de Parnamirim!',
      html,
    });
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
