const express = require('express');
const router = express.Router();
const multer = require('multer');
const controller = require('../controllers/obligationsController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    cb(null, file.mimetype === 'application/pdf');
  }
});

// GET /api/obligations - Obtener todas las obligaciones
router.get('/', controller.getAll);

// GET /api/obligations/upcoming - Próximos vencimientos
router.get('/upcoming', controller.getUpcoming);

// GET /api/obligations/overdue - Obligaciones vencidas
router.get('/overdue', controller.getOverdue);

// GET /api/obligations/summary - Resumen de obligaciones
router.get('/summary', controller.getSummary);

// GET /api/obligations/vector-fiscal - Datos formateados como RC-04A
router.get('/vector-fiscal', controller.getVectorFiscal);

// POST /api/obligations/import-pdf - Importar desde PDF del Vector Fiscal
router.post('/import-pdf', upload.single('vectorFiscal'), controller.importFromPDF);

// POST /api/obligations/reprocess - Re-procesar PDF guardado
router.post('/reprocess', controller.reprocessPDF);

// GET /api/obligations/:id - Obtener una obligación
router.get('/:id', controller.getById);

// POST /api/obligations - Crear obligación
router.post('/', controller.create);

// PUT /api/obligations/:id - Actualizar obligación
router.put('/:id', controller.update);

// DELETE /api/obligations/:id - Eliminar obligación
router.delete('/:id', controller.delete);

module.exports = router;

