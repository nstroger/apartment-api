import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import config from '../config/consts';
import logger from '../config/logger';

export const getToken = user =>
  jwt.sign({ id: user._id }, config.JWT_SECRET, {
    expiresIn: 86400, // expires in 24 hours
  });

export const response = (success, data) => ({
  success,
  data
})

export const isEnv = (env) => process.env.NODE_ENV === env

export const log = (text) => {
  if (isEnv('test')) {
    return;
  }

  logger.info(text);
}

export const sendEmail = (to, subject, msg) => {
  if (isEnv('test')) {
    return;
  }

  let transporter = nodemailer.createTransport({
    service: "Yandex",
    auth: {
      user: config.ADMIN_EMAIL,
      pass: config.ADMIN_PASSWORD
    }
  });

  let mailOptions = {
    from: config.ADMIN_EMAIL,
    to,
    subject,
    text: msg.text,
    html: msg.html
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return log('Error occured while sending email');
    }

    log('Email sent successfully');
  });
}

export const encodeEmail = email => {

  const jwtToken = jwt.sign({ email }, config.JWT_SECRET, {
    expiresIn: 86400
  });

  const base64Str = Buffer.from(jwtToken).toString('base64');

  return base64Str;
}

export const decodeToken = vToken => {

  const jwtToken = Buffer.from(vToken, 'base64').toString();

  try {

    const decoded = jwt.verify(jwtToken, config.JWT_SECRET);

    return decoded;  

  } catch (err) {
    return null;
  }
}

export const emailMsg = token => ({
  html: `Please verify your email by clicking <a href="http://localhost:4200/verify?token=${token}">here</a>.<br>This email expires in 24 hours.`,
  text: `Please verify your email by opening url http://localhost:4200/verify?token=${token}. This link expires in 24 hours.`
});

export const noop = () => {}
