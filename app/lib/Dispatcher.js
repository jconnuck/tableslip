var Arbiter = require('Arbiter');

var Dispatcher = Arbiter.create();
var Components = Arbiter;

var sockjs = window.sockjs = new SockJS('http://localhost:9000');

var Sources = {
  USER: 'USER',
  SERVER: 'SERVER'
}

var dispatchUserEvent = function(publisherData, message, subscriberData) {
  publisherData.source = Sources.USER;
  Dispatcher.publish(message, publisherData);
};

var dispatchServerEvent = function(e) {
  if (sockjs.readyState === SockJS.OPEN, e.type === 'message') {
    var data = JSON.parse(e.data);
    var message = data.message;
    var payload = data.payload;
    Dispatcher.publish(message, payload);
  };
};

// listen to user actions
Components.subscribe('*', dispatchUserEvent);

// listen to server actions
sockjs.onmessage = dispatchServerEvent;

module.exports = Dispatcher;