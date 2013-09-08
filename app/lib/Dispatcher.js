var Arbiter = require('Arbiter');
var Dispatcher = Arbiter.create();

var dispatchUserEvent = function(publisherData, message, subscriberData) {
  Dispatcher.publish(message, publisherData);
};

// listen to user actions
Arbiter.subscribe('*', dispatchUserEvent);
// TODO listen to server actions


module.exports = Dispatcher;