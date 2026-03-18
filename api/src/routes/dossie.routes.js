'use strict';

const { Router } = require('express');
const multer           = require('multer');
const dossieController = require('../controllers/dossie.controller');
const authMiddleware   = require('../middlewares/auth.middleware');
const validate         = require('../middlewares/validate.middleware');
const { createDossieValidator, updateDossieValidator } = require('../validators/dossie.validator');

const router = Router();
const upload = multer({
  storage:    multer.memoryStorage(),
  limits:     { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.csv$/i)) {
      return cb(new Error('Apenas arquivos .csv são aceitos.'));
    }
    cb(null, true);
  },
});

router.use(authMiddleware);

router.get('/',              dossieController.listar);
router.post('/importar-csv', upload.single('file'),            dossieController.importarCSV);
router.get('/:id',           dossieController.buscarPorId);
router.post('/',             createDossieValidator, validate,  dossieController.criar);
router.put('/:id',           updateDossieValidator, validate,  dossieController.atualizar);
router.delete('/:id',        dossieController.remover);

module.exports = router;
