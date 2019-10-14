const mysql=require("mysql");
var mysqldata={
    user:"group",
    password:"group",
    database:"WP",
    host:"120.79.19.253",
    port:"3306",
  connectionLimit: 10 

}
var pool=mysql.createPool(mysqldata);

module.exports = pool


