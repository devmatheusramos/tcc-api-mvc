const { Router } = require('express');
const AuditoriaController = require('../controllers/AuditoriaController');

const router = Router();

/**
 * @openapi
 * /logs:
 *   get:
 *     summary: Lista o historico de atividades da conta
 *     tags: [Auditoria]
 *     responses:
 *       200:
 *         description: Logs mais recentes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/LogAuditoria' }
 */
router.get('/', AuditoriaController.index);

module.exports = router;
