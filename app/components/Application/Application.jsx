/** @jsx React.DOM */
var React = require('React');
var ArbiterMixin = require('mixins/ArbiterMixin');

var Header = require('Header');
var Events = require('Events');

var EventStore = require('EventStore');

var Application = React.createClass({
  mixins: [ArbiterMixin],

  getInitialState: function () {
    return {
      events: []
    };
  },

  componentWillMount: function () {
    this.publish('init', {});

    EventStore.subscribe('loadedEvents', this.loadedEvents);
    EventStore.subscribe('rsvpUpdate', this.rsvpUpdate);
  },

  loadedEvents: function (payload) {
    var events = payload.events.slice(0,40);
    this.setState({
      events: events
    });
  },
  
  render: function () {
    return (
      <div class="Application">
        <Header />
        <Events events={this.state.events}/>
      </div>
    );
  }
});

module.exports = Application;