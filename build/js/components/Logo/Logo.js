/** @jsx React.DOM */

var React = require('React');
var ArbiterMixin = require('mixins/ArbiterMixin');

var Logo = React.createClass({displayName: 'Logo',
  mixins: [ArbiterMixin],

  componentWillMount: function () {
    EventStore.subscribe('loginChange', this.handleLoginChange);
    EventStore.subscribe('loadedEvents', this.handleLoadedEvents);
  },

  getInitialState: function () {
    return {
      loadedEvents: false
    };
  },

  handleLoadedEvents: function (data) {
    if (!data.cached) {
      this.setState({
        loadedEvents: true
      });
    }
  },

  handleLoginChange: function (payload) {
    var loggedIn = payload.loggedIn;
    this.setState({
      loggedIn : loggedIn
    });
  },
  
  render: function () {
    var spinnerClass = "spinner " + (this.state.loggedIn !== 'connected' || this.state.loadedEvents ? "hide" : "");

    return (
      React.DOM.div( {className:"Logo"}, 
      	React.DOM.span( {className:spinnerClass}),
" Tableslip "      )
    );
  }
});

module.exports = Logo;