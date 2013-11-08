var Arbiter = require('Arbiter').create();
var Store = require('Lawnchair');

// register to a dispatcher event

Store.prototype.publish = Arbiter.publish;
Store.prototype.subscribe = Arbiter.subscribe;

module.exports = Store;