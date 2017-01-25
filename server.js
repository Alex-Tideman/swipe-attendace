const express = require('express');
const app = express();
var path  = require("path");
const bodyParser = require('body-parser');

app.set('port', process.env.PORT || 3000);
app.locals.title = 'Attendance';
app.use(express.static(__dirname + '/public'));

app.get('/', (request, response) => {
  response.sendFile(path.join(__dirname+'/index.html'));
});

app.listen(app.get('port'), () => {
  console.log(`${app.locals.title} is running on ${app.get('port')}.`);
});
