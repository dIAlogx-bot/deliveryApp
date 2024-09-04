const db = require('../db');

function getAllProducts() {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM products`;
    db.all(query, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

function addProduct(nome, descricao, preco, disponibilidade, categoria) {
  return new Promise((resolve, reject) => {
    const query = `INSERT INTO products (nome, descricao, preco, disponibilidade, categoria) VALUES (?, ?, ?, ?, ?)`;    
    db.run(query, [nome, descricao, preco, disponibilidade, categoria], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.lastID);
      }
    });
  });
}

function getProductById(id) {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM products WHERE id = ?`;
    db.get(query, [id], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

//Função para atualizar o produto
function updateProduct(id, nome, descricao, preco, disponibilidade, categoria) {
  return new Promise((resolve, reject) => {
    const query = `UPDATE products SET nome = ?, descricao = ?, preco = ?, disponibilidade = ?, categoria = ? WHERE id = ?`;
    const disponibilidadeValue = disponibilidade === '1' ? 1 : 0;
    db.run(query, [nome, descricao, preco, disponibilidadeValue, categoria, id], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.changes);
      }
    });
  });
}

function deleteProduct(id) {
  return new Promise((resolve, reject) => {
    const query = `DELETE FROM products WHERE id = ?`;
    db.run(query, [id], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.changes);
      }
    });
  });
}

// Adicione outras funções CRUD conforme necessário

module.exports = {
  getAllProducts,
  addProduct,
  getProductById,
  updateProduct,
  deleteProduct
};
