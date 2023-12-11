require('dotenv').config();
const express = require('express')
const app = require('express')();
const http = require('http');
const fs = require('fs');
const { MongoPool } = require('./libraries/mongodb');
const swaggerUi = require('swagger-ui-express');
const swaggerFile = require('./swagger_output.json');

const port = process.env.PORT || 3000;
const host = process.env.HOST || '0.0.0.0';
const protocol = process.env.HTTPS === 'true' ? "https" : "http";

const pathServiceFiles = `${__dirname}/servicefiles/`;
if (!fs.existsSync(pathServiceFiles)){
    fs.mkdirSync(pathServiceFiles);
}
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 1;

app.use(express.json());
require('./endpoints/index')(app);
require('./endpoints/file')(app);
require('./endpoints/user')(app);
require('./endpoints/pdf')(app);
require('./endpoints/krungsriprop')(app);
require('./endpoints/livinginsider')(app);
require('./endpoints/goldprice')(app);
require('./endpoints/goldprice2')(app);
require('./endpoints/linenotify')(app);

const server = http.createServer(app);
    
if(process.env.NODE_ENV === 'development'){
    app.use('/doc', swaggerUi.serve, swaggerUi.setup(swaggerFile));
}

MongoPool.initPool();

server.listen(port);
console.log("Environment is %s", ((process.env.NODE_ENV)? process.env.NODE_ENV : "Production"));
console.log("Listening at: %s://%s:%s/", protocol, host, port);
