const sftp = require("ssh2-sftp-client");

async function conectarSFTPCondor() {
  
  try {
    const client = new sftp();
    await client.connect({
      host: process.env.HOST_FTP_LICITACIONES,
      user: process.env.USER_FTP_LICITACIONES,
      password: process.env.PASSWORD_FTP_LICITACIONES,
      secure: false,
    });
    console.log("Conectado al servidor SFTP");
    return client;
  } catch (err) {
    console.error("Error al conectar al servidor SFTP:", err);
    throw err;
  }
}

module.exports = { conectarSFTPCondor };
