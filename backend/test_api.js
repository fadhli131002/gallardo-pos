const jwt = require('jsonwebtoken');
const token = jwt.sign({ id: 1, role: 'admin' }, 'supersecretkey123');

async function testApi() {
  const res = await fetch('http://localhost:5000/api/reports/monthly/omset?month=2026-08', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log(res.status);
  console.log(await res.text());
}
testApi();
