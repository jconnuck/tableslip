/** @jsx React.DOM */

var React = require('React');
var ArbiterMixin = require('mixins/ArbiterMixin');

/** Stores */

/** Components */

var Rsvp = React.createClass({displayName: 'Rsvp',
  mixins: [ArbiterMixin],

  getInitialState: function () {
    return {
      status: this.props.status
    };
  },

  componentWillMount: function () {
    /** Subscribe to events */
  },

  going: function (event) {    
    event.preventDefault();

    FB.api('/' + this.props.eventID + '/attending', 'post', function (res) {
      console.log(res);
    });

    this.setState({
      status: 'attending'
    });
  },
  
  maybe: function (event) {
    event.preventDefault();

    FB.api('/' + this.props.eventID + '/maybe', 'post', function (res) {
      console.log(res);
    });
    
    this.setState({
      status: 'unsure'
    });
  },

  notGoing: function (event) {
    event.preventDefault();

    FB.api('/' + this.props.eventID + '/declined', 'post', function (res) {
      console.log(res);
    });

    this.setState({
      status: 'declined'
    });
  },

  render: function () {
    var goingClass = this.state.status === "attending" ? " active" : ""
    var maybeClass = this.state.status === "unsure" ? " active" : ""
    var notGoingClass = this.state.status === "declined" ? " active" : ""

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