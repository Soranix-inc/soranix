import morgan from "morgan"
import {httpLogger,systemLogger} from "./logger"
import { Request, Response } from "express";


interface LogData {
    method: string | undefined;
    url: string | undefined;
    agent: string | undefined;
    remoteAddress: string | undefined;
    status: number;
    contentLength: string | undefined;
    responseTime: number;
}

export const morganMiddleware = morgan(
    function (tokens, req: Request, res: Response) {
        const logObject: LogData = {
            method: tokens.method(req, res),
            url: tokens.url(req, res),
            agent: tokens["user-agent"](req, res),
            remoteAddress: tokens["remote-addr"](req, res),
            status: parseFloat(tokens.status(req, res) || "0"),
            contentLength: tokens.res(req, res, "content-length"),
            responseTime: parseFloat(tokens["response-time"](req, res) || "0"),
        };

        return JSON.stringify(logObject);
    },
    {
        stream: {
            write: (message: string) => {
                try {
                    const data = JSON.parse(message);
                    httpLogger.http("incoming-request", data);
                } catch (error) {
                    systemLogger.error("Failed to parse log message", { error, message });
                }
            },
        },
    }
);

