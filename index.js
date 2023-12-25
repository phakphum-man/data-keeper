require('dotenv').config();
const express = require('express')
const app = require('express')();
const http = require('http');
const fs = require('fs');
const path = require('path');
const socket = require("socket.io");
const { MongoPool } = require('./libraries/mongodb');
const swaggerUi = require('swagger-ui-express');
const swaggerFile = require('./swagger_output.json');
const { workQueue } = require("./libraries/jobBullMq");

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
require('./endpoints/runreport')(app);
require('./endpoints/krungsriprop')(app);
require('./endpoints/livinginsider')(app);
require('./endpoints/goldprice')(app);
require('./endpoints/goldprice2')(app);
require('./endpoints/linenotify')(app);

app.get('/public/*', (req, res) => {
    // #swagger.ignore = true
    const files = req.params;

    if(!files || files.length <= 0)
        return res.status(404).send("Not Found");

    const file = files[0];
    const filePath = path.join(__dirname, 'public', file);

    // HTML jquery script download chunks
    return res.sendFile(filePath);
});

const server = http.createServer(app);
const io = socket(server);
    
if(process.env.NODE_ENV === 'development'){
    app.use('/doc', swaggerUi.serve, swaggerUi.setup(swaggerFile));
}

io.on("connection", (socket) => {

    console.log("Client connected to Socket!")
  
    workQueue.on("completed", (job, result) => {
      if(job && job.id && result === true){
        socket.emit("message", result);
      }
    });
  
    socket.on("disconnect", () => {
      console.log("Client disconnected from Socket!")
    });
  
});

MongoPool.initPool();

server.listen(port);
console.log("Environment is %s", ((process.env.NODE_ENV)? process.env.NODE_ENV : "Production"));
console.log("Listening at: %s://%s:%s/", protocol, host, port);
