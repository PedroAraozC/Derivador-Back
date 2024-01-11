const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');

const pruebaRoutes = require('./routes/pruebaRoutes')

const app = express();
app.use(cors());
dotenv.config();

const PORT = process.env.PORT;

app.use(morgan('dev'))
app.use(express.json());
app.use(express.urlencoded({ extended: true }))

app.use('/listar', pruebaRoutes)

app.listen(PORT, () => { console.log(`server listening on port ${PORT}`) })