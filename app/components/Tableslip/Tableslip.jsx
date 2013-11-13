/** @jsx React.DOM */

var React = require('React');
var ArbiterMixin = require('mixins/ArbiterMixin');

var Rsvp = require('Rsvp');

var Tableslip = React.createClass({
  mixins: [ArbiterMixin],
  
  render: function () {
    var date = moment(this.props.event.start_time);
    var pics = this.props.event.friendIDs.slice(0,3).map(function(friendID) {
      return <img class="profilePic" src={"https://graph.facebook.com/" + friendID + "/picture"} alt="friend picture"/>;
    });

    var more = this.props.event.count - pics.length;
    if (more) {
      var count = <div class="profilePic count">{"+" + more}</div>
    };

    return (
      <a href={"http://www.facebook.com/" + this.props.event.id} class={"Tableslip " + date.format('ddd')}>
        <div class="name">{this.props.event.name}</div>
        <div class="group">{this.props.event.parent_group}</div>
        <div class="day">{date.format('dddd MMMM Do')}</div>
        <div class="time">{date.format('h:mm a')}</div>
        <Rsvp eventID={this.props.event.id} status={this.props.event.rsvp_status} />
        <div class="friends">
          <div class="facepile">
            {pics}
            {count}
          </div>
        </div>
      </a>
    );
  }
});

module.exports = Tableslip;