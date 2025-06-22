import {auth_app, server} from "./app"
import dotenv from "dotenv"
import chalk from "chalk"
import { systemLogger } from "@packages/logging"

dotenv.config()

const PORT = process.env.PORT || 6000



server.listen(PORT, () => {
    console.log(
        `${chalk.green.bold("Connected")} Auth Server running on ${chalk.yellow.bold(
            process.env.NODE_ENV
        )} on ${chalk.blue.bold(PORT)}`
    )
    systemLogger.info(`Auth Server running on ${PORT}`);
})