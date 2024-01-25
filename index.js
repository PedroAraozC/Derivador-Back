const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/dbUsuariosMongoDB');

const app = express();
app.use(cors());
dotenv.config();
connectDB();

const contableRoutes = require('./routes/contableRoutes')
const reclamosRoutes = require("./routes/reclamosRoutes")
const usuariosRoutes = require("./routes/usuariosRoutes")
const tiposDeUsuariosRoutes = require("./routes/tiposDeUsuariosRoutes")

const PORT = process.env.PORT;

app.use(morgan('dev'))
app.use(express.json());
app.use(express.urlencoded({ extended: true }))

app.use('/listar', contableRoutes)
app.use('/reclamos', reclamosRoutes)
app.use('/usuarios', usuariosRoutes)
app.use('/roles',tiposDeUsuariosRoutes)

app.listen(PORT, () => { console.log(`server listening on port ${PORT}`) })