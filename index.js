const fastify = require('fastify')({ logger: true });
//const fetch = require('node-fetch');
const path = require("path");
const db = require('./db');
const productsDb = require('./models/productsModel_db')
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

// Rota para login
fastify.post('/login', async (request, reply) => {
    const { usuario, senha } = request.body;
    if (!usuario || !senha) {
        return reply.code(400).send({ error: 'Usuário e senha são obrigatórios.' });
    }
    
    try {
        const user = await new Promise((resolve, reject) => {
            db.get(`SELECT * FROM users WHERE usuario = ?`, [usuario], (err, user) => {
                if (err) reject(err);
                else resolve(user);
            });
        });

        if (!user || user.senha !== senha) {
            return reply.code(401).send({ error: 'Usuário ou senha incorretos.' });
        }

        request.session.user = {
            id: user.id,
            nome: user.nome,
            usuario: user.usuario,
            admin: user.admin
        };
        console.log('Sessão do usuário:', request.session.user);
        
        return reply.redirect('/dashboard');
    } catch (error) {
        console.error('Erro durante o login:', error);
        return reply.code(500).send({ error: 'Erro ao verificar usuário.' });
    }
});

// Rota para exibir o dashboard (protegida por login)
fastify.get('/dashboard', (request, reply) => {
    console.log('Rota do dashboard atingida');
    if (!request.session.user) {
        return reply.redirect('/');  // Redireciona para o login se não estiver logado
    }

    reply.view('/dashboard.ejs', { user: request.session.user });
});

// Realizar logout
fastify.post('/logout', async (request, reply) => {
    if (request.session) {
        request.session.destroy((err) => {
            if (err) {
                reply.status(500).send({ error: 'Não foi possível fazer logout' });
            } else {
                reply.status(200).send({ message: 'Logout realizado com sucesso' });
            }
        });
    } else {
        reply.status(200).send({ message: 'Nenhuma sessão para encerrar' });
    }
});
  
// API para obter todos os produtos
fastify.get('/api/products', async (request, reply) => {
    try {
      const products = await productsDb.getAllProducts();
      return products;
    } catch (error) {
      console.error("Erro ao obter produtos:", error);
      reply.code(500).send({ error: "Erro interno do servidor" });
    }
  });

// Rota para a página de adicionar produto
fastify.get('/addProduct', (request, reply) => {
    reply.view('/addProduct.ejs', { user: request.session.user });
  });  

// API para adicionar um novo produto
fastify.post('/api/products', async (request, reply) => {
    const { nome, descricao, preco, disponibilidade } = request.body;
    
    try {
      const id = await productsDb.addProduct(nome, descricao, parseFloat(preco), disponibilidade);
      reply.code(201).send({ id, message: 'Produto adicionado com sucesso' });
    } catch (error) {
      console.error("Erro ao adicionar produto:", error);
      reply.code(500).send({ error: "Erro interno do servidor" });
    }
  });

// Rota para exibir o dashboard (protegida por login)
fastify.get('/products', (request, reply) => {
    
    if (!request.session.user) {
        return reply.redirect('/');  // Redireciona para o login se não estiver logado
    }

    reply.view('/products.ejs', { user: request.session.user });
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