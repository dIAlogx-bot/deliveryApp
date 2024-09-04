const fastify = require('fastify')({ logger: true });
//const fetch = require('node-fetch');
const path = require("path");
const db = require('./db');
const productsDb = require('./models/productsModel_db');
const clientsDb = require('./models/clientsModel_db');
const orderModel = require('./models/orderModels_db');
const categoriesDb = require('./models/categoriesModel_db');
const ejs = require("ejs")
const fastifyView = require("@fastify/view")
const fastifyStatic = require('@fastify/static');

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

// Serve arquivos estáticos da pasta 'public'
fastify.register(fastifyStatic, {
    root: path.join(__dirname, 'public'),
    prefix: '/public/', // Opcional, mas ajuda a definir um prefixo
});

fastify.register(require('@fastify/formbody'));
fastify.register(require('@fastify/cors'));

  

fastify.get('/', async (request, reply) => {
    return reply.view("login.ejs");
});

// Middleware para verificar se o usuário é administrador
function isAdmin(request, reply) {
    if (!request.session.user) {
        return reply.redirect('/');  // Redireciona para o login se não estiver logado
    }
    if (request.session.user.admin !== 1) { // Verifica se o valor de admin é 1
        return reply.redirect('/dashboard'); // Redireciona para o dashboard se não for admin
    }
}

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

    reply.view('/dashboard.ejs', { 
        user: request.session.user,
        query: request.query
     });
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
    // Chama a função de verificação antes de renderizar a página
    if (request.session.user && request.session.user.admin === 1) {
        reply.view('/addProduct.ejs', { user: request.session.user });
    } else {
        reply.redirect('/dashboard?alert=access-denied'); // Redireciona para o dashboard se não for admin
    }
});

// API para adicionar um novo produto
fastify.post('/api/products', async (request, reply) => {
    const { nome, descricao, preco, disponibilidade, categoria } = request.body;
    
    try {
      const id = await productsDb.addProduct(nome, descricao, parseFloat(preco), disponibilidade, categoria);
      console.log('Disponibilidade: ',disponibilidade);
      console.log('Categoria: ',categoria);
      reply.code(201).send({ id, message: 'Produto adicionado com sucesso' });
    } catch (error) {
      console.error("Erro ao adicionar produto:", error);
      reply.code(500).send({ error: "Erro interno do servidor" });
    }
  });

  // API para excluir um produto
fastify.delete('/api/products/:id', async (request, reply) => {
    const { id } = request.params;
    isAdmin(request, reply); // Chama a função de verificação
    try {
      const result = await productsDb.deleteProduct(id);
      if (result > 0) {
        reply.send({ message: 'Produto excluído com sucesso' });
      } else {
        reply.code(404).send({ error: 'Produto não encontrado' });
      }
    } catch (error) {
      reply.code(500).send({ error: 'Erro interno do servidor' });
    }
  });
  

// API para atualizar um produto
fastify.put('/api/products/:id', async (request, reply) => {
    const { id } = request.params;
    const { nome, descricao, preco, disponibilidade, categoria } = request.body;    
    try {
        const result = await productsDb.updateProduct(id, nome, descricao, parseFloat(preco), disponibilidade, categoria);
        if (result > 0) {
            return reply.send({ message: 'Produto atualizado com sucesso' }); // Certifique-se de usar `return`
        } else {
            return reply.code(404).send({ error: 'Produto não encontrado' });
        }
    } catch (error) {
        console.log('Nome: ', nome);
        console.log('Decrição: ', descricao);
        console.log('Preço: ', preco);
        console.log('Disponibilidade: ', disponibilidade);
        console.log('Categoria: ', categoria);
        return reply.code(500).send({ error: 'Erro interno do servidor' });        
    }
});


  // Rota para carregar a página de atualização com os dados do produto
fastify.get('/updateProduct/:id', async (request, reply) => {
    if (request.session.user && request.session.user.admin === 1){
        const { id } = request.params;        
        try {
            const product = await productsDb.getProductById(id); // Supondo que você tenha uma função getProductById
            if (!product) {
                return reply.code(404).send({ error: 'Produto não encontrado' });
            }
            
            // Renderizando a página com os dados do produto
            return reply.view('/updateProduct.ejs', { product });
        } catch (error) {
            console.error('Erro ao obter produto:', error);
            return reply.code(500).send({ error: 'Erro interno do servidor' });
        }
    }   else{
        reply.redirect('/products?alert=access-denied'); // Redireciona para o dashboard se não for admin
    }
});


// Rota para exibir produtos (protegida por login)
fastify.get('/products', (request, reply) => {
    
    if (!request.session.user) {
        return reply.redirect('/');  // Redireciona para o login se não estiver logado
    }

    reply.view('/products.ejs', { user: request.session.user });
});

// API para obter todos os clientes
fastify.get('/api/clients', async (request, reply) => {
    try {
      const clients = await clientsDb.getAllClients();
      return clients;
    } catch (error) {
      console.error("Erro ao obter clientes:", error);
      reply.code(500).send({ error: "Erro interno do servidor" });
    }
  });

  // API para obter todas as categorias
fastify.get('/api/categories', async (request, reply) => {
    try {
      const categories = await categoriesDb.getAllCategories();
      return categories;
    } catch (error) {
      console.error("Erro ao obter categoria:", error);
      reply.code(500).send({ error: "Erro interno do servidor" });
    }
  });

  
  fastify.post('/api/orders', async (request, reply) => {
    const { cliente, produtos, observacao } = request.body;

    if (!cliente || !produtos || !Array.isArray(produtos) || produtos.length === 0) {
        return reply.status(400).send({ error: 'Dados de entrada inválidos' });
    }

    let totalValue = 0;

    try {
        // Calcula o valor total
        for (const item of produtos) {
            if (typeof item.preco !== 'number' || typeof item.quantidade !== 'number') {
                return reply.status(400).send({ error: 'Preço ou quantidade inválida nos produtos' });
            }
            totalValue += item.quantidade * item.preco;
        }

        // Verifica se totalValue é válido
        if (isNaN(totalValue) || totalValue <= 0) {
            return reply.status(400).send({ error: 'Valor total do pedido inválido' });
        }

        // Converter totalValue para string no formato adequado para DECIMAL
        totalValue = totalValue.toFixed(2);

        // Dados do pedido para criação
        const orderData = {
            cliente_id: cliente,
            total: totalValue,
            observacao : observacao,
            status: 'Pedido Aberto', // Status inicial
        };

        // Insere o pedido na tabela 'orders' usando a função createOrder
        const orderId = await orderModel.createOrder(orderData);

        // Insere os itens na tabela 'orders_items' usando a função createOrderItem
        for (const item of produtos) {
            const itemData = {
                product_id: item.id,
                quantity: item.quantidade,
                price: item.preco.toFixed(2), // Converter preco para string no formato adequado
            };
            await orderModel.createOrderItem(orderId, itemData);
        }

        reply.send({ success: true, orderId });
    } catch (error) {
        console.error('Erro ao criar pedido:', error.message);
        reply.status(500).send({ error: 'Erro ao criar pedido' });
    }
});
   

  // Rota para novo pedido (protegida por login)
fastify.get('/newOrder', (request, reply) => {
    
    if (!request.session.user) {
        return reply.redirect('/');  // Redireciona para o login se não estiver logado
    }

    reply.view('/newOrder.ejs', { user: request.session.user });
}); 

// Rota para exibir Pedidos Abertos (protegida por login)
fastify.get('/openOrders', (request, reply) => {
    
    if (!request.session.user) {
        return reply.redirect('/');  // Redireciona para o login se não estiver logado
    }

    reply.view('/viewOrders.ejs', { user: request.session.user });
});

fastify.get('/api/orders', async (request, reply) => {
    try {
        const orders = await getAllOrders();  // Busca todos os pedidos
        reply.send(orders);
    } catch (err) {
        reply.code(500).send({ error: 'Erro ao buscar os pedidos' });
    }
});

// Rota para buscar pedidos abertos
fastify.get('/api/orders/open', async (request, reply) => {
    try {
        const orders = await orderModel.getAllOrders();
        reply.send(orders);
    } catch (error) {
        reply.status(500).send({ error: 'Erro ao buscar pedidos abertos' });
    }
});

// Rota para atualizar o status do pedido
fastify.put('/api/orders/:id/status', async (request, reply) => {
    const { id } = request.params;
    const { status } = request.body;

    try {
        const result = await orderModel.updateOrderStatus(id, status);
        if (result.updated > 0) {
            reply.send({ success: true });
        } else {
            reply.status(404).send({ error: 'Pedido não encontrado' });
        }
    } catch (error) {
        reply.status(500).send({ error: 'Erro ao atualizar o status do pedido' });
    }
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