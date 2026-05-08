require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

//Middleware
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
    console.log ("✅", req.method, req.url);
    next (); 
});

const userRoutes  = require("./routes/userRoutes");
app.use("/api/users", userRoutes);

mongoose
.connect(process.env.MONGO_URI)
.then(() => console.log('Conectado a MongoDB'))
.catch((error) => console.error(error));

//Habilitar puerto
const puerto =8000;
app.listen(puerto,() => console.log('Servidor corriendo',puerto));






