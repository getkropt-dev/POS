const jwt = require('jsonwebtoken');
require('dotenv').config();

const token = jwt.sign({ sub: 1, email: 'admin@admin.com', role: 'ADMIN' }, process.env.JWT_SECRET, { expiresIn: '1h' });

fetch('http://localhost:3000/reports/cash-sessions', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(res => res.text().then(text => ({ status: res.status, text })))
.then(res => console.log('Response:', res))
.catch(err => console.error(err));
