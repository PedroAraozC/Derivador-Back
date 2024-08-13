const sftp = require("ssh2-sftp-client");

async function conectarSFTPCondor() {
  
  try {
    const client = new sftp();
    await client.connect({
      host: process.env.HOST_SFTP_PAT,
      user: process.env.USER_SFTP_PAT,
      password: process.env.PASSWORD_SFTP_PAT,
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
