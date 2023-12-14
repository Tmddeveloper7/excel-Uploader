var Promise= require('bluebird');
var getSqlConnection = require('./mysql-config.js');

var db =  {
  getResultSet:function($model) {
    $model.statement.replace(/\\/g, "");
    return new Promise(function(resolve,reject) {
      Promise.using(getSqlConnection(),function(connection) {
        $options ={sql:$model.statement,nestTables: true} //,'nestTables':true}
        return connection.query($options)
      }).then($results =>{
        $model.data= $results
        resolve($model)
      }).catch(function(error) {
        console.log('i am getting an error',$model.statement)
        reject({"error":error});
      });
    });
  },
  insert:function($model) {
    $model.statement.replace(/\\/g, "");
    return new Promise(function(resolve,reject) {
      Promise.using(getSqlConnection(),function(connection) {
        connection.query($model.statement,$model.options.values)
          .then(function($results) {
            $model.results = $model.options.values;
            $model.options.data.id = $results.insertId;
            $model.results.id = $results.insertId;
            resolve($model);
        });
      }).catch(function(error) {
          console.log(error)
          reject(error);
      });
    });
  },
};

module.exports = db;
