async function test() {
  try {
    const res = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@odontosys.com', password: 'admin123' })
    });
    const data = await res.json();
    console.log('STATUS:', res.status);
    console.log('RESPONSE:', JSON.stringify(data, null, 2));

    const cookies = res.headers.get('set-cookie');
    console.log('SET-COOKIE:', cookies);
  } catch (err) {
    console.error('TEST ERROR:', err);
  }
}

test();
