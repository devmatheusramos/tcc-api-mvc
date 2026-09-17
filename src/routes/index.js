const { Router } = require('express');
const produtoRoutes = require('./produtoRoutes');
const jobRoutes = require('./jobRoutes');
const authRoutes = require('./authRoutes');
const { autenticar } = require('../middlewares/auth');

const router = Router();

router.use('/auth', authRoutes);
router.use('/jobs', autenticar, jobRoutes);
router.use('/produtos', autenticar, produtoRoutes);

module.exports = router;
