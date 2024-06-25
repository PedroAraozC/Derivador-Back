const ftp = require("basic-ftp");

async function conectarFTPLICITACIONES() {
    const client = new ftp.Client();
    client.ftp.verbose = true;

    try {
        await client.access({
            host: process.env.HOST_FTP_LICITACIONES,
            user: process.env.USER_FTP_LICITACIONES,
            password: process.env.PASSWORD_FTP_LICITACIONES,
            secure: false,
        });
        console.log("Conectado al servidor FTP");
        return client;
    } catch (err) {
        console.error("Error al conectar al servidor FTP:", err);
        throw err;
    }
}

module.exports = { conectarFTPLICITACIONES };
