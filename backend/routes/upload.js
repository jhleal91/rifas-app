const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const router = express.Router();

// Configurar almacenamiento con multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/public/images');
    // Asegurar que el directorio existe
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generar nombre único: timestamp + número aleatorio + extensión original
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '-');
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

// Tipos MIME permitidos (más estricto)
const allowedMimeTypes = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp'
];

// Extensiones permitidas
const allowedExtensions = ['.jpeg', '.jpg', '.png', '.gif', '.webp'];

// Filtrar solo imágenes con validación estricta
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype.toLowerCase();

  // Validar extensión
  if (!allowedExtensions.includes(ext)) {
    return cb(new Error(`Extensión no permitida: ${ext}. Solo se permiten: ${allowedExtensions.join(', ')}`));
  }

  // Validar MIME type (más importante que extensión)
  if (!allowedMimeTypes.includes(mimetype)) {
    return cb(new Error(`Tipo de archivo no permitido: ${mimetype}. Solo se permiten imágenes.`));
  }

  // Verificar que la extensión coincida con el MIME type
  const extToMime = {
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp'
  };

  if (extToMime[ext] !== mimetype) {
    return cb(new Error('La extensión del archivo no coincide con su tipo MIME. Posible archivo malicioso.'));
  }

  cb(null, true);
};

// Configurar multer con límites estrictos
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
    files: 1, // Solo un archivo por request
    fields: 10, // Máximo 10 campos de texto
    fieldNameSize: 100, // Nombre de campo máximo 100 caracteres
    fieldSize: 1024 * 1024 // Tamaño de campo máximo 1MB
  },
  fileFilter: fileFilter
});

// POST /api/upload/image - Subir imagen
router.post('/image', authenticateToken, requireAdmin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No se proporcionó ningún archivo',
        code: 'NO_FILE_PROVIDED'
      });
    }

    // Validaciones adicionales de seguridad
    const file = req.file;
    
    // Verificar tamaño (ya validado por multer, pero doble verificación)
    if (file.size > 5 * 1024 * 1024) {
      // Eliminar archivo si excede el límite
      fs.unlinkSync(file.path);
      return res.status(400).json({ 
        error: 'El archivo excede el tamaño máximo permitido (5MB)',
        code: 'FILE_TOO_LARGE'
      });
    }

    // Verificar que el archivo existe físicamente
    if (!fs.existsSync(file.path)) {
      return res.status(500).json({ 
        error: 'Error guardando el archivo',
        code: 'FILE_SAVE_ERROR'
      });
    }

    // Generar URL pública de la imagen
    // En producción, esto debería apuntar a tu dominio/CDN
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:5001';
    const imageUrl = `${baseUrl}/uploads/public/images/${file.filename}`;

    res.json({
      success: true,
      message: 'Imagen subida exitosamente',
      url: imageUrl,
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype,
      uploadedAt: new Date().toISOString()
    });
  } catch (error) {
    // Si hay error, eliminar archivo si fue creado
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error eliminando archivo después de error:', unlinkError);
      }
    }

    console.error('Error subiendo imagen:', error);
    
    // Manejar errores específicos de multer
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: 'El archivo excede el tamaño máximo permitido (5MB)',
        code: 'FILE_TOO_LARGE'
      });
    }
    
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ 
        error: 'Demasiados archivos. Solo se permite un archivo por request.',
        code: 'TOO_MANY_FILES'
      });
    }

    res.status(500).json({ 
      error: 'Error al subir la imagen',
      code: 'UPLOAD_ERROR',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor'
    });
  }
});

// Los archivos estáticos se sirven desde server.js

module.exports = router;

