/** @jsx React.DOM */
var React = require('React');
var ArbiterMixin = require('mixins/ArbiterMixin');

var Header = require('Header');
var Events = require('Events');

var EventStore = require('EventStore');

var Application = React.createClass({displayName: 'Application',
  mixins: [ArbiterMixin],

  getInitialState: function () {
    return {
      events: [],
      loggedIn: 'connected'
    };
  },

  componentWillMount: function () {
    this.publish('init', {});

    EventStore.subscribe('loadedEvents', this.loadedEvents);
    EventStore.subscribe('rsvpUpdate', this.rsvpUpdate);
    EventStore.subscribe('loginChange', this.handleLoginChange);
  },

  loadedEvents: function (payload) {
    var events = payload.events.slice(0,60);
    this.setState({
      events: events
    });
  },

  handleLoginChange: function (payload) {
    var loggedIn = payload.loggedIn;
    this.setState({
      loggedIn : loggedIn
    });
  },
  
  render: function () {
    var loginClass = "loginNotice " + (this.state.loggedIn === 'connected' ? "hide" : "");
    return (
      React.DOM.div( {className:"Application"}, 
        Header(null ),
        React.DOM.h1( {className:loginClass}, "Login to Facebook to see upcoming events"),
        Events( {events:this.state.events})
      )
    );
  }
});

module.exports = Application;