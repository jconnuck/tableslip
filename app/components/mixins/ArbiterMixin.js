/** @jsx React.DOM */

var Arbiter = require('Arbiter');

/** hooks react components into to pub/sub events */

var ArbiterMixin = {
  componentWillMount: function() {
    this.sub = [];
  },

  componentWillUnmount: function() {
    this.sub.map(function(e) {
      Arbiter.unsubscribe(e);
    });
  },

  Arbiter: Arbiter
};

module.exports = ArbiterMixin;