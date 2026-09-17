const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Produtos — MVC',
      version: '1.0.0',
      description:
        'API REST de CRUD de Produtos (pos-graduacao em Arquitetura de Software), ' +
        'construida em Node.js + Express seguindo o padrao MVC + Service, ' +
        'com persistencia em SQLite, rate limit e fila BullMQ/Redis para escritas assincronas.',
    },
    servers: [{ url: '/api', description: 'Servidor local' }],
    security: [{ bearerAuth: [] }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        CredenciaisCadastro: {
          type: 'object',
          required: ['nome', 'email', 'senha'],
          properties: {
            nome: { type: 'string', example: 'Maria Silva' },
            email: { type: 'string', format: 'email', example: 'maria@email.com' },
            senha: { type: 'string', format: 'password', minLength: 6 },
          },
        },
        CredenciaisLogin: {
          type: 'object',
          required: ['email', 'senha'],
          properties: {
            email: { type: 'string', format: 'email', example: 'maria@email.com' },
            senha: { type: 'string', format: 'password' },
          },
        },
        Produto: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            nome: { type: 'string', example: 'Teclado Mecanico' },
            preco: { type: 'number', format: 'float', example: 250.9 },
            categoria: { type: 'string', example: 'Perifericos', nullable: true },
            estoque: { type: 'integer', example: 10 },
            criado_em: { type: 'string', format: 'date-time' },
          },
        },
        NovoProduto: {
          type: 'object',
          required: ['nome', 'preco'],
          properties: {
            nome: { type: 'string', example: 'Teclado Mecanico' },
            preco: { type: 'number', format: 'float', example: 250.9 },
            categoria: { type: 'string', example: 'Perifericos' },
            estoque: { type: 'integer', example: 10 },
          },
        },
        Erro: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
        JobEnfileirado: {
          type: 'object',
          properties: {
            jobId: { type: 'string', example: '1' },
            status: { type: 'string', example: 'na fila' },
            mensagem: { type: 'string' },
          },
        },
        JobStatus: {
          type: 'object',
          properties: {
            jobId: { type: 'string', example: '1' },
            status: { type: 'string', example: 'completed' },
            progress: { type: 'number', example: 0 },
            resultado: {
              oneOf: [
                { $ref: '#/components/schemas/Produto' },
                {
                  type: 'object',
                  properties: {
                    removido: { type: 'boolean', example: true },
                    id: { type: 'integer', example: 1 },
                  },
                },
              ],
              nullable: true,
            },
            erro: { type: 'string', nullable: true, example: null },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);
