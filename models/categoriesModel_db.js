const db = require('../db');



function getAllCategories() {
    return new Promise((resolve, reject) => {
      const query = `SELECT * FROM categories`;
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
    getAllCategories    
  };