const { createLogger, transports, format } = require("winston");

const logger = createLogger({
    transports: [
        new transports.File({
            level: 'warn',
            filename: 'logsWarnings.log'
        }),
    ],
    format: format.combine(
        format.json(),
        format.timestamp(),
        format.metadata(),
        format.prettyPrint()
    ),
})

module.exports = logger