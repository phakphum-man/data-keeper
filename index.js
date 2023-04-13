require('dotenv').config();
const app = require('express')();
const http = require('http');
const swaggerUi = require('swagger-ui-express');
const swaggerFile = require('./swagger_output.json');

const port = process.env.PORT || 3000;
const host = process.env.HOST || 'localhost';
const protocol = process.env.HTTPS === 'true' ? "https" : "http";

http.createServer(app).listen(port);
console.log("Listening at: %s://%s:%s/", protocol, host, port);

app.use('/doc', swaggerUi.serve, swaggerUi.setup(swaggerFile));

require('./endpoints/index')(app);
require('./endpoints/file')(app);
require('./endpoints/user')(app);
require('./endpoints/krungsriprop')(app);