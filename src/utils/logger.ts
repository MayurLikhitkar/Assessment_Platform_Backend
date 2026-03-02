import winston, { type transport } from 'winston';
import { LOG_LEVEL } from '../config/envConfig';

const { combine, timestamp, printf, colorize, errors, splat, json } = winston.format;

// Colors for each level
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'blue',
    http: 'magenta',
    debug: 'cyan'
};

winston.addColors(colors);

// Format for console output (development)
const consoleFormat = combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    // Merge metadata into message BEFORE colorize, so everything gets colored
    winston.format((info) => {
        const { level, message, timestamp, splat, ...meta } = info;
        if (Object.keys(meta).length) {
            info.message = `${message} ${JSON.stringify(meta, null, 2)}`;
        }
        return info;
    })(),
    colorize({ all: true }),
    printf(({ timestamp, level, message }) => {
        return `${timestamp} [${level}]: ${message}`;
    })
);

// Log format
const fileFormat = combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    splat(),
    json()
);

// Transports to use based on environment
const transports: transport[] = [
    // Console transport (always enabled)
    new winston.transports.Console({
        format: consoleFormat
    }),

    // File transport for errors
    new winston.transports.File({
        // filename: path.join('logs', 'error.log'),
        filename: 'logs/error.log',
        level: 'error',
        format: fileFormat,
        maxsize: 5 * 1024 * 1024,  // 5 MB
        maxFiles: 5,
    }),

    // File transport for all logs
    new winston.transports.File({
        // filename: path.join('logs', 'combined.log'),
        filename: 'logs/combined.log',
        format: fileFormat,
        maxsize: 10 * 1024 * 1024, // 10 MB
        maxFiles: 5,
    })
];


const logger = winston.createLogger({
    level: LOG_LEVEL ?? 'info',
    format: combine(
        errors({ stack: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    ),
    transports,
    // Don't exit on unhandled errors
    exitOnError: false,
});

export default logger;