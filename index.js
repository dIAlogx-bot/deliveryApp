const fastify = require('fastify')({ logger: true });
//const fetch = require('node-fetch');
const path = require("path");
const db = require('./db');
const usersModel = require('./models/usersModel_db');
const ejs = require("ejs")
const fastifyView = require("@fastify/view")

fastify.register(fastifyView, {
    engine: {
      ejs
    },
    root: path.join(__dirname, 'views'), // Diretório onde seus arquivos .ejs estão localizados
  });



fastify.register(require('@fastify/formbody'));
fastify.register(require('@fastify/cors'));

  

fastify.get('/', async (request, reply) => {
    return reply.view("login.ejs");
});

const start = async () => {
    try {
        await fastify.listen({port: 4000, host: '0.0.0.0'});
        console.log('Servidor rodando na porta 4000');
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};
start();