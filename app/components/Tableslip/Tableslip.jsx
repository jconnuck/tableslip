/** @jsx React.DOM */

var React = require('React');
var ArbiterMixin = require('mixins/ArbiterMixin');

var Rsvp = require('Rsvp');

var Tableslip = React.createClass({
  mixins: [ArbiterMixin],

  profileLink: function (friendID) {
    document.location = "https://www.facebook.com/" + friendID;
  },
  
  render: function () {
    var date = moment(this.props.event.start_time);
    var friends = this.props.event.friends || {};
    var pics = Object.keys(friends).slice(0,5).map(function(friendID) {


      return <span class="tooltip" data-hint={friends[friendID].name}><img class="profilePic" src={"https://graph.facebook.com/" + friendID + "/picture"} onClick={this.profileLink.bind(friendID)} } alt="friend picture"/></span>;
    });

    var more = this.props.event.count - pics.length;
    if (more) {
      var moreFriends = Object.keys(friends).slice(5).map(function(friendID) {
        return friends[friendID].name;
      });
      var count = <span class="tooltip" data-hint={moreFriends.join("\n")}><div class="profilePic count">{"+" + more}</div></span>;
    };

    var invited = this.props.event.invited ? " Invited" : "";

    if (this.props.event.cover) {
      var backgroundStyle = {
        'background': 'url(' + this.props.event.cover + ')'    
      };
    }

    var name = this.props.event.name.length > 120 ? this.props.event.name.substring(0,120) + '. . .' : this.props.event.name;

    return (
      <a href={"http://www.facebook.com/" + this.props.event.id} class={"Tableslip " + date.format('ddd') + invited}>
        <div class="background" style={backgroundStyle} />
        <div class="foreground">
          <div class="name">{name}</div>
          <div class="group">{this.props.event.parent_group}</div>
          <div class="day">{date.format('dddd MMMM Do')}</div>
          <div class="time">{date.format('h:mm a')}</div>
          <Rsvp eventID={this.props.event.id} rsvp_status={this.props.event.rsvp_status} />
          <div class="friends">
            <div class="facepile">
              {pics}
              {count}
            </div>
          </div>
        </div>
      </a>
    );
  }
});

module.exports = Tableslip;