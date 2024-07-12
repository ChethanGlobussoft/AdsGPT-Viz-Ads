import winston, { createLogger } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import fs from 'fs';
import path from 'path';

// Ensure the logs directory exists
const logDirectory = path.resolve('resources/logs/logs');
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory, { recursive: true });
}

// Define the transport for daily log rotation
const dailyRotateFileTransport = new DailyRotateFile({
  filename: path.join(logDirectory, 'application-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '50m',
  maxFiles: '14d', // Keeps logs for 14 days
});

// Define custom formats for colored logging
const consoleFormat = winston.format.combine(
  winston.format.colorize({
    all: true,
  }),
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

const fileFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Define the console transport
const consoleTransport = new winston.transports.Console({
  format: consoleFormat,
});

// Create the logger with the defined transports and settings
const logger = createLogger({
  level: process.env.ENV === 'dev' ? 'debug' : 'info',
  format: fileFormat,
  transports: [
    dailyRotateFileTransport,
    ...(process.env.ENV === 'dev' ? [consoleTransport] : []),
  ],
});

export default logger;
