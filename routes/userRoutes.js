const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// LOGIN DE USUARIOS
router.post("/login", async (req, res) => {
  try {
    const { id, password } = req.body;

    // Validar campos
    if (!id || !password) {
      return res.status(400).json({error: "Todos los campos son obligatorios"
      });
    }

    // Buscar usuario
    const user = await User.findOne({ id });
    if (!user) {
      return res.status(400).json({error: "Usuario no registrado"
      });
    }

    // Comparar contraseña
    const validPassword = await bcrypt.compare(
      password,
      user.password
    );

    // Verificar contraseña
    if (!validPassword) {
      return res.status(400).json({error: "Contraseña incorrecta"
      });
    }

    // Crear token
    const token = jwt.sign({ id: user._id },
      process.env.JWT_SECRET, { expiresIn: "1h" }
    );

    // Respuesta
    res.json({
      message: "Login exitoso",
      token,
      user: {
        name: user.name,
        second_name: user.second_name,
        email: user.email
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({error: "Error en login"
    });
  }
});

// REGISTRO DE USUARIOS
router.post("/register", async (req, res) => {

  try {
    const {
      name,
      second_name,
      id,
      email,
      password,
      confirmPassword
    } = req.body;

    /// Validar campos
    if (
      !name ||
      !second_name ||
      !id ||
      !email ||
      !password ||
      !confirmPassword
    ) {
      return res.status(400).json({error: "Todos los campos son obligatorios"});
    }

    // Normalizar email (DESPUÉS de validar)
    const normalizedEmail = email
      .toLowerCase()
      .trim();

    // Validar contraseñas
    if (password !== confirmPassword) {
      return res.status(400).json({error: "Las contraseñas no coinciden"});
    }

    // Validar email
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({error: "Email inválido"});
    }

    // Validar documento
    if (isNaN(id)) {
      return res.status(400).json({error: "El documento debe ser numérico"});
    }

    // Validar duplicados
    const userExists = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { id }
      ]
    });

    if (userExists) {
      if (userExists.email === normalizedEmail) {
        return res.status(400).json({error: "El correo ya está registrado"});
      }

      if (userExists.id === id) {
        return res.status(400).json({error: "El documento ya está registrado"});
      }
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(
      password, 10 );

    // Crear usuario
    const newUser = new User({
      name,
      second_name,
      id,
      email: normalizedEmail,
      password: hashedPassword,
      confirmPassword: hashedPassword
    });

    // Mostar datos en consola
    console.log("Datos recibidos:", req.body);
    await newUser.save();

    res.status(201).json({message: "✅ Usuario registrado correctamente"});

  } catch (error) {
    console.error(error);

    // Error duplicados MONGODB
    if (error.code === 11000) {
      return res.status(400).json({error: "El correo o documento ya existen"});
    }
    res.status(500).json({error: "Error interno del servidor"});
  }
});

// MOSTRAR USUARIOS
router.get("/", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {console.error(error);
    res.status(500).json({error: "Error al obtener usuarios"});
  }
});

// ACTUALIZAR USUARIO
router.put("/:id", async (req, res) => {
  try {
    const {
      email,
      password,
      confirmPassword
    } = req.body;

    // Valida email
    if (email) {
      const normalizedEmail = email
        .toLowerCase()
        .trim();

      req.body.email = normalizedEmail;
      const emailRegex = /\S+@\S+\.\S+/;

      if (!emailRegex.test(normalizedEmail)) {
        return res.status(400).json({error: "Email inválido"});
      }
    }

    // Validar contraseñas
    if (password || confirmPassword) {
      if (password !== confirmPassword) {
        return res.status(400).json({error: "Las contraseñas no coinciden"});
      }

      // HASH contraseñas
      const hashedPassword = await bcrypt.hash(password, 10);
      req.body.password = hashedPassword;
      req.body.confirmPassword = hashedPassword;
    }

    // ACTUALIZAR
    const updatedUser =
      await User.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );

    res.json({message: "Usuario actualizado correctamente", updatedUser});

  } catch (error) {
    console.error(error);
    res.status(500).json({error: "Error actualizando usuario"});
  }
});

// ELIMINAR USUARIO
router.delete("/:id", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({message: "Usuario eliminado correctamente"});
  } catch (error) {console.error(error);
    res.status(500).json({error: "Error al eliminar usuario"});
  }
});

module.exports = router;




