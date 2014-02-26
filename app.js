var express = require('express');
var sockjs  = require('sockjs');
var http    = require('http');
var redis   = require('redis').createClient();
var redis_confirmations = require('redis').createClient();

var EventTypes = {
  TOGGLE_ITEM: 'toggleDone',
  AUTH: 'login'
};

var REDIS_CHANNEL = 'lightwait';

// 1. Echo sockjs server
var sockjs_opts = {sockjs_url: "http://cdn.sockjs.org/sockjs-0.3.min.js"};

var connections = {};
var sockjs_broadcast = sockjs.createServer();
sockjs_broadcast.on('connection', function(conn) {
	connections[conn.id] = conn;
  console.log('new connection');
  conn.on('data', function(msg) {
    console.log('message', msg);
    var message = JSON.parse(msg);      
  });
});

// 2. Listen for confirmations from data_server
redis_confirmations.subscribe(REDIS_CHANNEL);
redis_confirmations.on("message", function (channel, message) {
  console.log("data_server ", channel, message);
});

// 3. Express server
var app = express(); /* express.createServer will not work here */
var server = http.createServer(app);

app.use(express.compress());

app.use(require('connect-livereload')({
  port: 35729
}));

sockjs_broadcast.installHandlers(server, { prefix : '/sock' });

exports = module.exports = server;
// delegates user() function
exports.use = function() {
  app.use.apply(app, arguments);
};
