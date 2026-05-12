fetch('http://localhost:3000/api/agent', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: 'como bañar un perro' })
}).then(res => res.json())
  .then(data => console.log('Response:', data))
  .catch(err => console.error('Error:', err));
