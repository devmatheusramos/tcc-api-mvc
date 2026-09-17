const { Router } = require('express');
const produtoRoutes = require('./produtoRoutes');
const jobRoutes = require('./jobRoutes');

const router = Router();

router.use('/jobs', jobRoutes);
router.use('/produtos', produtoRoutes);

module.exports = router;
