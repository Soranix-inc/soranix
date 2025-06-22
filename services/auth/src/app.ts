import { systemLogger } from "@packages/logging"
import * as http from "node:http";
import express, { Express } from 'express'



const auth_app: Express = express()

const server = http.createServer(auth_app)






export {
    auth_app, server
}