/** @jsx React.DOM */

var React = require('React');
var ArbiterMixin = require('mixins/ArbiterMixin');

/** Stores */

/** Components */

var Rsvp = React.createClass({displayName: 'Rsvp',
  mixins: [ArbiterMixin],

  getInitialState: function () {
    return {
      rsvp_status: this.props.rsvp_status
    };
  },

  componentWillMount: function () {
    /** Subscribe to events */
    Dispatcher.subscribe('rsvpUpdate/' + this.props.eventID, this.rsvpUpdate);
  },

  rsvp: function (rsvp_status) {
    this.publish('rsvp', {
      eventID: this.props.eventID,
      rsvp_status: rsvp_status,
    });
  },

  rsvpUpdate: function (data) {
    var rsvp_status = data.rsvp_status;
    this.setState({
      rsvp_status: rsvp_status
    });
  },

  going: function (event) {
    event.preventDefault();
    this.rsvp('attending');    
  },
  
  maybe: function (event) {
    event.preventDefault();
    this.rsvp('maybe');
  },

  notGoing: function (event) {
    event.preventDefault();
    this.rsvp('declined');
  },

  render: function () {
    var goingClass = this.state.rsvp_status === "attending" ? " active" : "";
    var maybeClass = this.state.rsvp_status === "maybe" ? " active" : "";
    var notGoingClass = this.state.rsvp_status === "declined" ? " active" : "";

    return (
      React.DOM.div( {className:"Rsvp"}, 
        React.DOM.div( {onClick:this.going, className:"rsvpButton" + goingClass}, "Going"),
        React.DOM.div( {onClick:this.maybe, className:"rsvpButton" + maybeClass}, "Maybe"),
        React.DOM.div( {onClick:this.notGoing, className:"rsvpButton" + notGoingClass}, "Not Going")
      )
    );
  }
});

module.exports = Rsvp;