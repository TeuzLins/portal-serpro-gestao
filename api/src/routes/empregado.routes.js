'use strict';

const { Router } = require('express');
const multer               = require('multer');
const empregadoController  = require('../controllers/empregado.controller');
const authMiddleware        = require('../middlewares/auth.middleware');
const validate              = require('../middlewares/validate.middleware');
const {
  createEmpregadoValidator,
  updateEmpregadoValidator,
  listEmpregadosValidator,
} = require('../validators/empregado.validator');

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 10 * 1024 * 1024 }, // 10 MB máximo
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.csv$/i)) {
      return cb(new Error('Apenas arquivos .csv são aceitos.'));
    }
    cb(null, true);
  },
});

// Todas as rotas exigem autenticação
router.use(authMiddleware);

// GET  /empregados
router.get('/',              listEmpregadosValidator, validate, empregadoController.listar);

// POST /empregados/importar-csv  (antes de /:id para não ser capturado como ID)
router.post('/importar-csv', upload.single('file'),              empregadoController.importarCSV);

// GET  /empregados/:id
router.get('/:id',           empregadoController.buscarPorId);

// POST /empregados
router.post('/',             createEmpregadoValidator, validate, empregadoController.criar);

// PUT  /empregados/:id
router.put('/:id',           updateEmpregadoValidator, validate, empregadoController.atualizar);

// DELETE /empregados/:id
router.delete('/:id',        empregadoController.remover);

module.exports = router;
