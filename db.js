const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',     // default for XAMPP
  password: '',     // default is blank in XAMPP
  database: 'quickmeet'
});

db.connect((err) => {
  if (err) {
    console.error('DB connection failed:', err.stack);
    return;
  }
  console.log('MySQL connected');
});

module.exports = db;