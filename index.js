const fastify = require('fastify')({ logger: true });
//const fetch = require('node-fetch');
const path = require("path");
const db = require('./db');

const usersModel = require('./models/usersModel_db');
const ejs = require("ejs")
const fastifyView = require("@fastify/view")

const fastifySession = require('@fastify/session');
const fastifyCookie = require('@fastify/cookie');

// Registro dos plugins de sessão e cookie
fastify.register(fastifyCookie);
fastify.register(fastifySession, {
    secret: '6b9b469d782980d492cf9fc20c9bd5082dc1a38071270529e81db15fc0b51da2',  // Troque por uma chave secreta forte
    saveUninitialized: false,
    cookie: { secure: false }  // Em produção, deve ser true para HTTPS
});

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

// Rota para processar o login
fastify.post('/login', async (request, reply) => {
    const { usuario, senha } = request.body;

    if (!usuario || !senha) {
        return reply.code(400).send({ error: 'Usuário e senha são obrigatórios.' });
    }

    // Verifica se o usuário existe e se a senha está correta
    db.get(`SELECT * FROM users WHERE usuario = ?`, [usuario], (err, user) => {
        if (err) {
            return reply.code(500).send({ error: 'Erro ao verificar usuário.' });
        }

        if (!user || user.senha !== senha) {
            return reply.code(401).send({ error: 'Usuário ou senha incorretos.' });
        }

        // Se o login for bem-sucedido, cria uma sessão para o usuário
        request.session.user = {
            id: user.id,
            nome: user.nome,
            usuario: user.usuario,
            admin: user.admin
        };

        console.log('Usuário logado:', request.session.user); // Adicione este log

        // Redireciona para o dashboard
        return reply.redirect('dashboard');
    });
});

// Rota para exibir o dashboard (protegida por login)
fastify.get('/dashboard', (request, reply) => {
    if (!request.session.user) {
        return reply.redirect('/');  // Redireciona para o login se não estiver logado
    }

    reply.view('dashboard.ejs', { user: request.session.user });
});

// Realizar logout
fastify.post('/logout', async (request, reply) => {
    request.session.destroy();
    return reply.redirect('/');
  });
  
  fastify.get('/usuarios', async (request, reply) => {
    db.all("SELECT * FROM users", [], (err, rows) => {
        if (err) {
            reply.send(err);
        } else {
            reply.send(rows);
        }
    });
});



async function start() {
    try {
        await fastify.listen({ port: 4000, host: '0.0.0.0' });
        console.log('Servidor rodando na porta 4000');
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
}
start();