const ftp = require("basic-ftp");

async function conectarFTPCiudadano() {
  const client = new ftp.Client();
  client.ftp.verbose = true;

  try {
    await client.access({
      host: process.env.HOST_FTP_CIU,
      user: process.env.USER_FTP_CIU,
      password: process.env.PASSWORD_FTP_CIU,
      secure: false,
    });
    console.log("Conectado al servidor FTP");
    return client;
  } catch (err) {
    console.error("Error al conectar al servidor FTP:", err);
    throw err;
  }
}

module.exports = { conectarFTPCiudadano };
