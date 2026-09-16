const { Router } = require('express');
const ProdutoController = require('../controllers/ProdutoController');

const router = Router();

// Rotas fixas (/count, /search) precisam vir antes de /:id,
// senao o Express interpreta "count"/"search" como valor de :id.
router.get('/count', ProdutoController.count);
router.get('/search', ProdutoController.findByName);

router.post('/', ProdutoController.create);
router.get('/', ProdutoController.findAll);
router.get('/:id', ProdutoController.findById);
router.put('/:id', ProdutoController.update);
router.delete('/:id', ProdutoController.delete);

module.exports = router;
