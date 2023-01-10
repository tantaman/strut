import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

export default class MailService {
  #client;
  constructor() {
    this.#client = new SESv2Client({
      region: "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_KEY_ID!,
        secretAccessKey: process.env.AWS_KEY_SECRET!,
      },
      apiVersion: "2019-09-27",
    });
  }

  async sendEmail(to: string, subject: string, body: string) {
    const command = new SendEmailCommand({
      Content: {
        Simple: {
          Body: {
            Text: {
              Data: body,
            },
          },
          Subject: {
            Data: subject,
          },
        },
      },
      Destination: {
        ToAddresses: [to],
      },
      FromEmailAddress: "no-reply@vlcn.io",
    });
    this.#client.send(command);
  }
}
