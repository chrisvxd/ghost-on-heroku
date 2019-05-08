var ghost = require('ghost');
var cluster = require('cluster');
var express = require('express');
var urlService = require('./node_modules/ghost/core/server/services/url');

// Heroku sets `WEB_CONCURRENCY` to the number of available processor cores.
var WORKERS = process.env.WEB_CONCURRENCY || 1;

if (cluster.isMaster) {
  // Master starts all workers and restarts them when they exit.
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Starting a new worker because PID: ${worker.process.pid} exited code ${code} from ${signal} signal.`);
    cluster.fork();
  });
  for (var i = 0; i < WORKERS; i++) {
    cluster.fork();
  }
} else {
  var parentApp = express();

  // Run Ghost in each worker / processor core.
  ghost()
    .then(function (ghostServer) {
      ////////////////////////////////////////////////////////////////
      // this is what you need to get subdirectories working properly!
      // e.g. https://www.website.com/blog
      parentApp.use(urlService.utils.getSubdir(), ghostServer.rootApp);
      ghostServer.start(parentApp);
      ////////////////////////////////////////////////////////////////
    });
}
