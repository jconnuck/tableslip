var Arbiter = require('Arbiter').create();
var Store = require('Lawnchair');

// register to a dispatcher event

Store.prototype.publish = Arbiter.publish;
Store.prototype.subscribe = Arbiter.subscribe;
Store.prototype.unsubscribe = Arbiter.unsubscribe;

module.exports = Store;