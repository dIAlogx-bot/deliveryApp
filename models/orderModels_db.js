// models/orderModels_db.js

const db = require('../db');


// Função para criar um novo pedido
async function createOrder(orderData) {
    const { cliente_id, total, observacao, status } = orderData;
    const result = await new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO orders (client_id, total_value, order_status, note) VALUES (?, ?, ?, ?)`,
            [cliente_id, total, status, observacao],
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

// Função para buscar pedidos abertos
async function getOpenOrders() {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT o.id, o.client_id, o.total_value, o.order_status, c.first_name, c.phone,
                   GROUP_CONCAT(p.nome || ' (Qtd: ' || oi.quantity || ')') AS itens
            FROM orders o
            JOIN clients c ON o.client_id = c.id
            JOIN orders_items oi ON o.id = oi.order_id
            JOIN products p ON oi.product_id = p.id
            WHERE o.order_status = 'Pedido Aberto'
            GROUP BY o.id
            ORDER BY o.id ASC
        `;

        db.all(query, [], (err, rows) => {
            if (err) {
                return reject(err);
            }
            resolve(rows);
        });
    });
}

// Função para buscar Todos pedidos difernte de Pedido Concluído
async function getAllOrders() {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT o.id, o.client_id, o.total_value, o.order_status, o.note, c.first_name, c.last_name, c.phone,
                   GROUP_CONCAT(p.nome || ' (Qtd: ' || oi.quantity || ')') AS itens
            FROM orders o
            JOIN clients c ON o.client_id = c.id
            JOIN orders_items oi ON o.id = oi.order_id
            JOIN products p ON oi.product_id = p.id            
            GROUP BY o.id
            ORDER BY o.id ASC
        `;

        db.all(query, [], (err, rows) => {
            if (err) {
                return reject(err);
            }
            resolve(rows);
        });
    });
}

// Função para obter um pedido pelo ID
async function getOrderById(id) {
    return await db.get(
        `SELECT * FROM orders WHERE id = ?`,
        [id]
    );
}

// Função para atualizar o status do pedido
async function updateOrderStatus(orderId, status) {
    return new Promise((resolve, reject) => {
        const query = `UPDATE orders SET order_status = ? WHERE id = ?`;
        db.run(query, [status, orderId], function (err) {
            if (err) {
                return reject(err);
            }
            resolve({ updated: this.changes });
        });
    });
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
    getAllOrders,
    getOrderById,
    updateOrderStatus,
    deleteOrder,
};
