const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
app.use(cors());
dotenv.config();

const ditecContableRoutes = require('./routes/ditecContableRoutes')
const ditecReclamosRoutes = require("./routes/ditecReclamosRoutes")

const PORT = process.env.PORT;

app.use(morgan('dev'))
app.use(express.json());
app.use(express.urlencoded({ extended: true }))

app.use('/listar', ditecContableRoutes)
app.use('/reclamos', ditecReclamosRoutes)

app.listen(PORT, () => { console.log(`server listening on port ${PORT}`) })