const express = require('express');
const bodyParser = require('body-parser');
const sql = require('mssql');

const app = express();
app.use(bodyParser.json());

const pool = new sql.ConnectionPool({
    connectionString: process.env.CONNECTION_STRING
  });
  


app.post('/api/add', async (req, res) => {
  try {
    const rawData = req.body.data;
    const params = rawData.split(',').map(item => item.trim());

    const request = pool.request();

    // Gán động các tham số
    params.forEach((param, index) => {
      request.input(`param${index + 1}`, param);
    });

    // Tạo chuỗi gọi procedure theo dạng EXEC
    const paramPlaceholders = params.map((_, i) => `@param${i + 1}`).join(', ');
    const result = await request.query(`EXEC callProcedurePost ${paramPlaceholders}`);

    res.json({ msg: result.recordset?.[0]?.msg || 'Thành công' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Lỗi server' });
  }
});


app.get('/api/get', async (req, res) => {
  try {
    const rawData = req.query.data;
    const params = rawData.split(',').map(item => item.trim());

    const request = pool.request();

    // Gán động các tham số
    params.forEach((param, index) => {
      request.input(`param${index + 1}`, param);
    });

    const paramPlaceholders = params.map((_, i) => `@param${i + 1}`).join(', ');
    const result = await request.query(`EXEC callProcedureGet ${paramPlaceholders}`);

    const queryStr = result.recordset?.[0]?.query;
    if (!queryStr) {
      return res.status(400).json({ msg: 'Không nhận được query từ procedure' });
    }

    const dataResult = await pool.request().query(queryStr);
    res.json({ data: dataResult.recordset });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Lỗi server' });
  }
});


app.listen(3000, () => {
  console.log('APP IS RUNNING IN 3000 PORT -- PLEASE OPEN PORT 3000 FOR PUBLIC -- ');
});
