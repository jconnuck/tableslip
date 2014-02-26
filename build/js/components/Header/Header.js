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
        React.DOM.div( {className:"fb-login-button", 'data-width':"1000", 'data-size':"medium", 'data-autologoutlink':"true", 'data-scope':"user_events, friends_events, rsvp_event"}),      
        Logo(null ),
        Filters(null )
      )
    );
  }
});

module.exports = Header;