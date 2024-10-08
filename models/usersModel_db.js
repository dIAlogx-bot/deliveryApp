const db = require('../db');



function getAllUsers() {
    return new Promise((resolve, reject) => {
      const query = `SELECT * FROM users`;
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
    getAllUsers    
  };
