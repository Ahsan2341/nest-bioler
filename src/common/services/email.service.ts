import nodemailer from 'nodemailer';

export class EmailService {
  async sendMail(to: string, subject: string, html: string) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.MAIL_FROM,
          pass: process.env.MAIL_PASSWORD,
        },
      });

      await transporter.sendMail({
        from: process.env.MAIL_FROM,
        to,
        subject,
        html,
      });
    } catch (error) {
      throw new Error(error);
    }
  }
}
