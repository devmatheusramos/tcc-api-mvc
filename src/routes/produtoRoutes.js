const { Router } = require('express');
const ProdutoController = require('../controllers/ProdutoController');

const router = Router();

/**
 * @openapi
 * /produtos/count:
 *   get:
 *     summary: Retorna o total de produtos cadastrados
 *     tags: [Produtos]
 *     responses:
 *       200:
 *         description: Total de produtos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total: { type: integer, example: 3 }
 */
// Rotas fixas (/count, /search) precisam vir antes de /:id,
// senao o Express interpreta "count"/"search" como valor de :id.
router.get('/count', ProdutoController.count);

/**
 * @openapi
 * /produtos/search:
 *   get:
 *     summary: Busca produtos por nome (parcial)
 *     tags: [Produtos]
 *     parameters:
 *       - in: query
 *         name: nome
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Lista de produtos encontrados
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Produto' }
 *       400:
 *         description: Parametro "nome" nao informado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 */
router.get('/search', ProdutoController.findByName);

/**
 * @openapi
 * /produtos:
 *   post:
 *     summary: Cria um produto
 *     tags: [Produtos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/NovoProduto' }
 *     responses:
 *       201:
 *         description: Produto criado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Produto' }
 *       400:
 *         description: Dados invalidos
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 *   get:
 *     summary: Lista todos os produtos
 *     tags: [Produtos]
 *     responses:
 *       200:
 *         description: Lista de produtos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Produto' }
 */
router.post('/', ProdutoController.create);
router.get('/', ProdutoController.findAll);

/**
 * @openapi
 * /produtos/{id}:
 *   get:
 *     summary: Busca um produto por ID
 *     tags: [Produtos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Produto encontrado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Produto' }
 *       404:
 *         description: Produto nao encontrado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 *   put:
 *     summary: Atualiza um produto (campos parciais aceitos)
 *     tags: [Produtos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/NovoProduto' }
 *     responses:
 *       200:
 *         description: Produto atualizado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Produto' }
 *       404:
 *         description: Produto nao encontrado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 *   delete:
 *     summary: Remove um produto
 *     tags: [Produtos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204:
 *         description: Produto removido
 *       404:
 *         description: Produto nao encontrado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 */
router.get('/:id', ProdutoController.findById);
router.put('/:id', ProdutoController.update);
router.delete('/:id', ProdutoController.delete);

module.exports = router;
