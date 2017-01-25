const express = require('express');
const app = express();
const path  = require("path");
const bodyParser = require('body-parser');
const turing = require('./public/students')

app.set('port', process.env.PORT || 3000);
app.locals.title = 'Turing Attendance';
app.use(express.static(__dirname + '/public'));

app.get('/', (request, response) => {
  response.sendFile(path.join(__dirname+'/index.html'));
});

app.get('/:program/:cohort', (request, response) => {
  response.json(turing[request.params.program][request.params.cohort]);
});


app.listen(app.get('port'), () => {
  console.log(`${app.locals.title} is running on ${app.get('port')}.`);
});
