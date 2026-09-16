const { Router } = require('express');
const produtoRoutes = require('./produtoRoutes');

const router = Router();

router.use('/produtos', produtoRoutes);

module.exports = router;
