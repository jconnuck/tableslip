/** @jsx React.DOM */

var React = require('React');
var ArbiterMixin = require('mixins/ArbiterMixin');

var Logo = require('Logo');
var Filters = require('Filters');

var EventStore = require('EventStore');

var Header = React.createClass({displayName: 'Header',
  mixins: [ArbiterMixin],
  
  render: function () {
    return (
      React.DOM.div( {className:"Header"}, 
        Logo(null ),
        Filters(null ),
        React.DOM.div( {className:"fb-login-button-wrapper"}, 
          React.DOM.div( {className:"fb-login-button", 'data-size':"icon", 'data-autologoutlink':"true", 'data-scope':"user_events, friends_events, rsvp_event"})
        )
      )
    );
  }
});

module.exports = Header;