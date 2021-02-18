//libraries
const nodemailer = require("nodemailer");
const { resolveContent } = require("nodemailer/lib/shared");

//custom
const { sendEmailOverride } = require("../processes/send-email.js");
const SettingsModel = require("../models/Settings");

exports.sendEmail = async ({ to, from, subject, text, token }) => {
  return new Promise(async (resolve, reject) => {
    if (await sendEmailOverride({ to, from, subject, text })) return resolve();

    const {
      vars: { host, fromEmail, company, username },
    } = SettingsModel.findOne({});

    subject = this.parseEmailTemplateString(subject, {
      host,
      fromEmail,
      company,
      username,
      token,
      userEmail: to,
    });
    text = this.parseEmailTemplateString(text, {
      host,
      fromEmail,
      company,
      username,
      token,
      userEmail: to,
    });

    let transporter = nodemailer.createTransport({
      service: "SendGrid",
      auth: {
        user: process.env.SENDGRID_USER,
        pass: process.env.SENDGRID_PASSWORD,
      },
    });

    const mailOptions = {
      to,
      fromEmail,
      subject,
      text,
    };
  });

  resolve(transporter.sendMail(mailOptions));
};

// if you hit this, the console will log "WARNING: Self signed certificate in certificate chain. Retrying with the self signed certificate. Use a valid certificate if in production."
exports.sendEmailWithSecurityDowngrade = async ({
  to,
  from,
  subject,
  text,
  token,
}) => {
  return new Promise(async (resolve, reject) => {
    if (await sendEmailOverride({ to, from, subject, text })) return resolve();

    const {
      vars: { host, fromEmail, company, username },
    } = SettingsModel.findOne({});

    subject = this.parseEmailTemplateString(subject, {
      host,
      fromEmail,
      company,
      username,
      token,
      userEmail: to,
    });
    text = this.parseEmailTemplateString(text, {
      host,
      fromEmail,
      company,
      username,
      token,
      userEmail: to,
    });

    let transporter = nodemailer.createTransport({
      service: "SendGrid",
      auth: {
        user: process.env.SENDGRID_USER,
        pass: process.env.SENDGRID_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const mailOptions = {
      to,
      from,
      subject,
      text,
    };
  });

  resolve(transporter.sendMail(mailOptions));
};

exports.parseEmailTemplateString = (
  text,
  { host, fromEmail, company, username, token, userEmail }
) => {
  text = text.replaceAll("{{host}}", host);
  text = text.replaceAll("{{fromEmail}}", fromEmail);
  text = text.replaceAll("{{company}}", company);
  text = text.replaceAll("{{token}}", token);
  text = text.replaceAll("{{userEmail}}", userEmail);
  text = text.replaceAll("{{username}}", username);

  return text;
};