const { Router } = require('express');
const produtoRoutes = require('./produtoRoutes');
const jobRoutes = require('./jobRoutes');
const authRoutes = require('./authRoutes');
const colaboradorRoutes = require('./colaboradorRoutes');
const auditoriaRoutes = require('./auditoriaRoutes');
const { autenticar } = require('../middlewares/auth');

const router = Router();

router.use('/auth', authRoutes);
router.use('/colaboradores', autenticar, colaboradorRoutes);
router.use('/logs', autenticar, auditoriaRoutes);
router.use('/jobs', autenticar, jobRoutes);
router.use('/produtos', autenticar, produtoRoutes);

module.exports = router;
