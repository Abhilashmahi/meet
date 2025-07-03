const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'sql12.freesqldatabase.com',
  user: 'sql12788087',
  password: 'GH26sp92Ip',
  database: 'sql12788087',
  port: 3306
});

db.connect((err) => {
  if (err) {
    console.error('DB connection failed:', err.stack);
    return;
  }
  console.log('MySQL connected to FreeSQLDatabase.com');
});

module.exports = db;
