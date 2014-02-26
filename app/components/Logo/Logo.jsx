/** @jsx React.DOM */

var React = require('React');
var ArbiterMixin = require('mixins/ArbiterMixin');

var Logo = React.createClass({
  mixins: [ArbiterMixin],

  componentWillMount: function () {
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
  
  render: function () {
    var spinnerClass = "spinner " + (this.state.loadedEvents ? "hide" : "");

    return (
      <div class="Logo">
      	<span class={spinnerClass}></span>
        Tableslip
      </div>
    );
  }
});

module.exports = Logo;