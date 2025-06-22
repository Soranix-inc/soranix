import { format, loggers, transports } from "winston";
import "winston-daily-rotate-file";



const { combine, timestamp, colorize, json, printf, prettyPrint } = format;


const commonFormat = combine(
    colorize({ all: true }),
    timestamp({ format: "YYYY-MM_DD hh:mm:ss.SSS A" }),
    prettyPrint(),
    printf(({ level, message, timestamp }) => `${timestamp} [${level.toUpperCase()}]: ${message}`)
);

const errorFormat = printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} ${level}: ${message}\n${stack || ""}`;
});

const fileRotateTransport = new transports.DailyRotateFile({
    dirname: "logs",
    filename: 'combined.log',
    datePattern: 'YYYY-MM-DD-HH',
    maxFiles: "2d",
    maxSize: "20m",

});
loggers.add("HttpLogger", {
    level: "http",
    format: commonFormat,
    transports: [
        fileRotateTransport,
        new transports.Console(),
        new transports.File({ dirname: "logs", filename: "error.log", level: "error", format: errorFormat }),
        new transports.File({ dirname: "logs", filename: "info.log", level: "info", format: json() }),
    ],
    exceptionHandlers: [
        new transports.File({ dirname: "logs", filename: "exceptions.log" }),
    ],
    rejectionHandlers: [
        new transports.File({ dirname: "logs", filename: "rejections.log" }),
    ],
});

// Debug/System Logger
loggers.add("Logger", {
    // level: config.NODE_ENV === "development" ? "debug" : "info",
    level: "info",
    format: commonFormat,
    transports: [
        new transports.Console(),
        new transports.File({ dirname: "logs", filename: "system-debug.log" }),
    ],
});


export const httpLogger = loggers.get("HttpLogger");
export const systemLogger = loggers.get("Logger");
