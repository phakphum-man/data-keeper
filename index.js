require('dotenv').config();
const app = require('express')();
const http = require('http');
const fs = require('fs');
const terminus = require('@godaddy/terminus');
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

require('./endpoints/index')(app);
require('./endpoints/file')(app);
require('./endpoints/user')(app);
require('./endpoints/krungsriprop')(app);
require('./endpoints/livinginsider')(app);

const server = http.createServer(app);
    
if(process.env.NODE_ENV === 'development'){
    app.use('/doc', swaggerUi.serve, swaggerUi.setup(swaggerFile));
}

const onSigterm = () => {
  console.info('server is starting cleanup')
  return Promise.resolve();
}

const onShutdown = () => {
  console.info('cleanup finished, server is shutting down');
}

const onHealthCheck = ({ state }) => Promise.resolve(`UP (state.isShuttingDown => ${state.isShuttingDown})`);

terminus.createTerminus(server, {
  // healtcheck options
  healthChecks: {
    '/healthcheck': onHealthCheck,
    verbatim: true,
    __unsafeExposeStackTraces: true,
  },
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "OPTIONS, POST, GET",
  },
  // cleanup options
  timeout: 1000,
  onSigterm,
  onShutdown,
  logger: console.log,
});

server.listen(port);
console.log("Environment is %s", ((process.env.NODE_ENV)? process.env.NODE_ENV : "Production"));
console.log("Listening at: %s://%s:%s/", protocol, host, port);
