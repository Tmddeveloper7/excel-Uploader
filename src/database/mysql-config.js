var mysql = require('promise-mysql');
var config = require('../config/db.json')

pool = mysql.createPool(config);

async function getSqlConnection() {
  return pool.then(p => {
    return p.getConnection().disposer(function(connection) {
      //releaseConnection(connection);
      connection.release()
    });
  })
}

module.exports = getSqlConnection;


