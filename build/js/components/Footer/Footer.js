/** @jsx React.DOM */

var React = require('React');
var ArbiterMixin = require('mixins/ArbiterMixin');

/** Stores */

/** Components */

var Footer = React.createClass({displayName: 'Footer',
  mixins: [ArbiterMixin],

  componentWillMount: function () {
    /** Subscribe to events */
  },
  
  render: function () {
    return (
      React.DOM.div( {className:"Footer"}, 
        React.DOM.div( {className:"fb-login-button", 'data-width':"200", 'data-autologoutlink':"true", 'data-scope':"user_events, friends_events"})
      )
    );
  }
});

module.exports = Footer;