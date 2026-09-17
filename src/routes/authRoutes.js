const { Router } = require('express');
const AuthController = require('../controllers/AuthController');
const { autenticar } = require('../middlewares/auth');

const router = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Cria uma conta e inicia a sessao
 *     tags: [Autenticacao]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CredenciaisCadastro' }
 *     responses:
 *       201: { description: Conta criada }
 *       400: { description: Dados invalidos }
 */
router.post('/register', AuthController.register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Autentica um usuario e devolve um JWT
 *     tags: [Autenticacao]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CredenciaisLogin' }
 *     responses:
 *       200: { description: Login realizado }
 *       401: { description: Credenciais incorretas }
 */
router.post('/login', AuthController.login);
router.post('/logout', AuthController.logout);
router.get('/me', autenticar, AuthController.me);

module.exports = router;
