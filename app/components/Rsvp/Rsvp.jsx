/** @jsx React.DOM */

var React = require('React');
var ArbiterMixin = require('mixins/ArbiterMixin');

/** Stores */

/** Components */

var Rsvp = React.createClass({
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
      <div class="Rsvp">
        <div onClick={this.going} class={"rsvpButton" + goingClass}>Going</div>
        <div onClick={this.maybe} class={"rsvpButton" + maybeClass}>Maybe</div>
        <div onClick={this.notGoing} class={"rsvpButton" + notGoingClass}>Not Going</div>
      </div>
    );
  }
});

module.exports = Rsvp;