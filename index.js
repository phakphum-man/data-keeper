require('dotenv').config();
const app = require('express')();
const http = require('http');
const fs = require('fs');
const swaggerUi = require('swagger-ui-express');
const swaggerFile = require('./swagger_output.json');

const port = process.env.PORT || 3000;
const host = process.env.HOST || '127.0.0.1';
const protocol = process.env.HTTPS === 'true' ? "https" : "http";

const pathServiceFiles = `${__dirname}/servicefiles/`;
if (!fs.existsSync(pathServiceFiles)){
    fs.mkdirSync(pathServiceFiles);
}

http.createServer(app).listen(port);
console.log("Environment is %s", ((process.env.NODE_ENV)? process.env.NODE_ENV : "Production"));
console.log("Listening at: %s://%s:%s/", protocol, host, port);

if(process.env.NODE_ENV === 'development'){
    app.use('/doc', swaggerUi.serve, swaggerUi.setup(swaggerFile));
}
require('./endpoints/index')(app);
require('./endpoints/file')(app);
require('./endpoints/user')(app);
require('./endpoints/krungsriprop')(app);
require('./endpoints/livinginsider')(app);