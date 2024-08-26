// models/orderModels_db.js

const db = require('../db');


// Função para criar um novo pedido
async function createOrder(orderData) {
    const { cliente_id, total, status } = orderData;
    const result = await new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO orders (client_id, total_value, order_status) VALUES (?, ?, ?)`,
            [cliente_id, total, status],
            function (err) {
                if (err) {
                    return reject(err);
                }
                resolve({ lastID: this.lastID }); // Retorna o ID do pedido criado
            }
        );
    });
    return result.lastID;
}

// Função para criar um item de pedido
async function createOrderItem(orderId, itemData) {
    const { product_id, quantity, price } = itemData;
    await new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO orders_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)`,
            [orderId, product_id, quantity, price],
            function (err) {
                if (err) {
                    return reject(err);
                }
                resolve();
            }
        );
    });
}

// Função para obter pedidos abertos
async function getOpenOrders() {
    return await db.all(
        `SELECT orders.id, clients.first_name AS cliente_nome, clients.telefone, orders.total, orders.status 
        FROM orders 
        JOIN clients ON orders.client_id = clients.id 
        WHERE orders.status = 'Pedido Aberto'`
    );
}

// Função para obter um pedido pelo ID
async function getOrderById(id) {
    return await db.get(
        `SELECT * FROM orders WHERE id = ?`,
        [id]
    );
}

// Função para atualizar o status de um pedido
async function updateOrderStatus(id, status) {
    const result = await db.run(
        `UPDATE orders SET status = ? WHERE id = ?`,
        [status, id]
    );
    return result.changes; // Retorna o número de linhas afetadas
}

// Função para excluir um pedido
async function deleteOrder(id) {
    const result = await db.run(
        `DELETE FROM orders WHERE id = ?`,
        [id]
    );
    return result.changes;
}




module.exports = {
    createOrder,
    createOrderItem,
    getOpenOrders,
    getOrderById,
    updateOrderStatus,
    deleteOrder,
};
