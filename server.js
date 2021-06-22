const express = require('express');
const app = express();
app.listen(3000, () => {
  console.log('App Server Started at port 3000. Browse your api on http://localhost:3000');
});
app.get('/', (req, res) => {
  res.send('Hey There');
});
