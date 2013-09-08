var Arbiter = require('Arbiter');
var Lawnchair = require('Lawnchair');

var Store = Lawnchair;

// register to a dispatcher event

Store.prototype.subscribe = Arbiter.subscribe;

Store.prototype.publish = Arbiter.publish;

module.exports = Store;