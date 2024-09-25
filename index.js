const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./config/dbUsuariosMongoDB");
const bodyParser = require('body-parser');
const https = require('https');
const fs = require('fs');
const app = express();

app.use(cors());
dotenv.config();
// connectDB();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: '20mb' }));

const contableRoutes = require("./routes/contableRoutes");
const reclamosRoutes = require("./routes/reclamosRoutes");
const usuariosRoutes = require("./routes/usuariosRoutes");
const tiposDeUsuariosRoutes = require("./routes/tiposDeUsuariosRoutes");
const ciudadanoDigitalRoutes = require("./routes/ciudadanoDigitalRoutes");
const gestionFinancieraRoutes = require("./routes/gestionFinancieraRoutes");
const educacionRoutes = require("./routes/educacionRoutes");
const adminRoutes = require("./routes/adminRoutes");
const macroRoutes = require("./routes/macroRoutes")
const turnosRoutes = require("./routes/turnosRoutes");
const patrimonioRoutes = require("./routes/patrimonioRoutes");
const gerenciaDatosRoutes=require("./routes/gerenciaDatosRoutes");

//pedro Back
const boletinRoutes = require("./routes/boletinRoutes");
const normaRoutes = require("./routes/normaRoutes");
const origenRoutes = require("./routes/origenRoutes.js");
//
const PORT = process.env.PORT;

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/listar', contableRoutes)
app.use('/reclamos', reclamosRoutes)
app.use('/usuarios', usuariosRoutes)
app.use('/roles',tiposDeUsuariosRoutes)
app.use('/ciudadanoDigital',ciudadanoDigitalRoutes)
app.use('/gestionFinanciera', gestionFinancieraRoutes)
app.use('/educacion', educacionRoutes)
app.use('/admin', adminRoutes)
app.use("/macro",macroRoutes)
app.use("/turnos", turnosRoutes);
app.use("/patrimonio", patrimonioRoutes);
app.use("/gerenciaDatos",gerenciaDatosRoutes);

//pedro back
app.use("/boletin", boletinRoutes);
app.use("/norma", normaRoutes);
app.use("/origen", origenRoutes);
//

// const options = {
//     key: fs.readFileSync('./scfg0cbqs'),
//     cert: fs.readFileSync('./scfg0cbqs'),
//     //ca: fs.readFileSync('/opt/psa/var/certificates/scfqdiDyQ') // si tienes un archivo CA bundle
//   };
  
//   https.createServer(options, app).listen(5000, () => {
//     console.log(`server listening on port 5000`);
//   });

  app.listen(3050, () => {
    console.log(`server listening on port 3050`);
  });