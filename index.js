const express = require('express');
const bodyParser = require('body-parser');
const sql = require('mssql/msnodesqlv8');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

const pool = new sql.ConnectionPool({
  connectionString: process.env.CONNECTION_STRING
});

let connectedPool;

// Kết nối SQL một lần khi server khởi động
pool.connect().then(p => {
  connectedPool = p;
  console.log('Kết nối SQL thành công');
}).catch(err => {
  console.error('Không thể kết nối SQL:', err);
});

// Hàm format các tham số truyền vào procedure
const buildParams = values => values.map(v => `N'${v}'`).join(', ');

// Hàm xử lý gọi procedure chung
const callProcedure = (procName, dataString, res) => {
  if (!dataString) return res.status(400).json({ msg: 'Thiếu tham số data' });
  if (!connectedPool) return res.status(500).json({ msg: 'SQL chưa kết nối' });

  const values = dataString.split(',').map(v => v.trim());
  const query = `EXEC ${procName} ${buildParams(values)}`;

  connectedPool.request().query(query)
    .then(result => {
      const rows = result.recordset;
      if (rows.length > 0 && rows[0].ThongBao) {
        res.json({ msg: rows[0].ThongBao });
      } else {
        res.json(rows);
      }
    })
    .catch(err => {
      console.error('Lỗi:', err);
      res.status(500).json({ msg: 'Lỗi server' });
    });
};

// API GET
app.get('/api/get', (req, res) => {
  callProcedure('API_GET', req.query.data, res);
});

// API POST
app.post('/api/post', (req, res) => {
  callProcedure('API_POST', req.body.data, res);
});

app.listen(3000, () => {
  console.log('🚀 API chạy tại PORT 3000');
});
