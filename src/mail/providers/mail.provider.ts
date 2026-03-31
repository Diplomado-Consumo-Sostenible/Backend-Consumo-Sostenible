import { Inject, Injectable, Logger } from '@nestjs/common';
import * as path from 'path';
import * as hbs from 'handlebars';
import * as fs from 'fs';
import type { Transporter } from 'nodemailer';

@Injectable()
export class MailProvider {
  private readonly logger = new Logger(MailProvider.name);

  constructor(
    @Inject('MAIL_TRANSPORT') private readonly transporter: Transporter,
  ) {}

  private async renderTemplate(
    templateName: string,
    context: Record<string, any>,
  ): Promise<string> {
    const templatePath = path.join(
      __dirname,
      '..',
      'templates',
      `${templateName}.hbs`,
    );
    const source = fs.readFileSync(templatePath, 'utf8');
    const compiled = hbs.compile(source);
    return compiled(context);
  }

  async sendMail(
    to: string,
    subject: string,
    template: string,
    context: Record<string, any>,
  ) {
    try {
      const html = await this.renderTemplate(template, context);
      await this.transporter.sendMail({
        from: `"Mi Gasto" <${process.env.MAIL_USER}>`,
        to,
        subject,
        html,
      });
      this.logger.log(`Correo enviado correctamente a ${to} (${subject})`);
    } catch (error) {
      this.logger.error(`Error al enviar correo a ${to}`, error);
      throw error;
    }
  }
}
