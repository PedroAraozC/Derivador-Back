const ftp = require("basic-ftp");

const conectarFTPCiudadano = async () => {
  try {
    const client = new ftp.Client();
    await client.access({
      host: process.env.HOST_FTP_CIU,
      user: process.env.USER_FTP_CIU,
      password: process.env.PASSWORD_FTP_CIU,
      secure: false,
    });
    // console.log(process.env.PASSWORD_FTP_CIU, "client");
    return client;
  } catch (error) {
    console.error("Error de conexión FTP:", error);
    throw error;
  }
};

module.exports = { conectarFTPCiudadano };
