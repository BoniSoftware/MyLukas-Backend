const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs"); 

// REGISTRO DE USUARIOS
router.post("/register", async (req, res) => {
  try {
    const { name, second_name, id, email, password, confirmPassword } = req.body;

    // 1. Validar campos
    if (!name || !second_name || !id || !email || !password || !confirmPassword ) {
      return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    // 2. Normalizar email (DESPUÉS de validar)
    const normalizedEmail = email.toLowerCase().trim();

    // 3. Validar contraseñas
    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Las contraseñas no coinciden" });
    }

    // 4. Validar email
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ error: "Email inválido" });
    }

    // 5. Validar id numérico
    if (isNaN(id)) {
      return res.status(400).json({ error: "El documento debe ser numérico" });
    }

    // 6. Verificar duplicados
    const userExists = await User.findOne({
      $or: [{ email: normalizedEmail }, { id }]
    });

    if (userExists) {
      if (userExists.email === normalizedEmail) {
        return res.status(400).json({ error: "El correo ya está registrado" });
      }
      if (userExists.id === id) {
        return res.status(400).json({ error: "El documento ya está registrado" });
      }
    }

    // 7. Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // 8. Crear usuario
    const newUser = new User({
      name,
      second_name,
      id,
      email: normalizedEmail,
      password: hashedPassword,
      confirmPassword: hashedPassword
    });
    
    // 9. Mostar datos en consola
    console.log("Datos recibidos:", req.body);

    await newUser.save();
    res.status(201).json({message: "✅ Usuario guardado correctamente"});
  } 
  catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return res.status(400).json({error: "El correo o documento ya existen"});
      }
    res.status(500).json({error: "Error interno del servidor"});
  }
});

// LOGIN DE USUARIOS
const jwt = require("jsonwebtoken");

router.post("/login", async (req, res) => {
  try{
    const {id, password} =req.body;
    const user = await User.findOne({id});

    if (!user){
      return res.status(400).json({error: "Usuario no registrado"});
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch){
      return res.status(400).json({error: "Contraseña incorrecta"});
    }
    const token =jwt.sign(
      {id:user._id},
      process.env.JWT_SECRET,
      {expiresIn: "1h"}
    );
    res.json({message: "Login exitoso",}); 
  }

  catch (error) {
    return res.status(500).json({error: "Login incorrecto"});
  }
});

module.exports = router;


