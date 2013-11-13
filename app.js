var express = require('express');
var sockjs  = require('sockjs');
var http    = require('http');

// 1. Echo sockjs server
var sockjs_opts = {sockjs_url: "http://cdn.sockjs.org/sockjs-0.3.min.js"};

var sockjs_echo = sockjs.createServer();
sockjs_echo.on('connection', function(conn) {
  console.log('new connection');
  conn.on('data', function(message) {
    console.log('message', message);
  });
});

// 2. Express server
var app = express(); /* express.createServer will not work here */
var server = http.createServer(app);

app.use(express.compress());

sockjs_echo.installHandlers(server, { prefix : '/sock' });

var oneDay = 86400000;
app.use(express.static(__dirname + '/public', { maxAge: oneDay }));
app.use('/bower_modules', express.static(__dirname + '/bower_modules'));

server.listen(9001);

module.exports = app;
