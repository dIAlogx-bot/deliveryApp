// index.js
const fastify = require('fastify')({ logger: true });

fastify.get('/', async (request, reply) => {
    return { msg: 'Olá, mundo!' };
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