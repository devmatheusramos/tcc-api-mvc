const { Router } = require('express');
const JobController = require('../controllers/JobController');

const router = Router();

/**
 * @openapi
 * /jobs/{id}:
 *   get:
 *     summary: Consulta o status de um job assincrono
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Status atual do job
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/JobStatus' }
 *       404:
 *         description: Job nao encontrado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 */
router.get('/:id', JobController.findById);

module.exports = router;
