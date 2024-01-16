const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/dbUsuarios');

const app = express();
app.use(cors());
dotenv.config();
connectDB();

const ditecContableRoutes = require('./routes/ditecContableRoutes')
const ditecReclamosRoutes = require("./routes/ditecReclamosRoutes")
const ditecUsuariosRoutes = require("./routes/ditecUsuariosRoutes")

const PORT = process.env.PORT;

app.use(morgan('dev'))
app.use(express.json());
app.use(express.urlencoded({ extended: true }))

app.use('/listar', ditecContableRoutes)
app.use('/reclamos', ditecReclamosRoutes)
app.use('/usuarios', ditecUsuariosRoutes)

app.listen(PORT, () => { console.log(`server listening on port ${PORT}`) })