const { Router } = require('express');
const ColaboradorController = require('../controllers/ColaboradorController');
const { somenteProprietario } = require('../middlewares/auth');

const router = Router();

router.use(somenteProprietario);

/**
 * @openapi
 * /colaboradores:
 *   get:
 *     summary: Lista os colaboradores ativos da conta
 *     tags: [Colaboradores]
 *     responses:
 *       200: { description: Lista de colaboradores }
 *       403: { description: Acesso permitido apenas ao proprietario }
 *   post:
 *     summary: Cria um colaborador com acesso ao mesmo espaco
 *     tags: [Colaboradores]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CredenciaisCadastro' }
 *     responses:
 *       201: { description: Colaborador criado }
 *       403: { description: Acesso permitido apenas ao proprietario }
 */
router.get('/', ColaboradorController.index);
router.post('/', ColaboradorController.create);

/**
 * @openapi
 * /colaboradores/{id}:
 *   delete:
 *     summary: Remove e bloqueia o acesso de um colaborador
 *     tags: [Colaboradores]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Colaborador removido }
 *       404: { description: Colaborador nao encontrado }
 */
router.delete('/:id', ColaboradorController.delete);

module.exports = router;
