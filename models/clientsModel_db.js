const db = require('../db');



function getAllClients() {
    return new Promise((resolve, reject) => {
      const query = `SELECT * FROM clients`;
      db.all(query, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }



module.exports = {
    getAllClients    
  };
