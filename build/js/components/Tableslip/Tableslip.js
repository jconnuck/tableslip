/** @jsx React.DOM */

var React = require('React');
var ArbiterMixin = require('mixins/ArbiterMixin');

var Rsvp = require('Rsvp');

var Tableslip = React.createClass({displayName: 'Tableslip',
  mixins: [ArbiterMixin],

  profileLink: function (friendID) {
    document.location = "https://www.facebook.com/" + friendID;
  },
  
  render: function () {
    var date = moment(this.props.event.start_time);
    var friends = this.props.event.friends;
    var pics = Object.keys(friends).slice(0,5).map(function(friendID) {
      return React.DOM.span( {className:"tooltip", 'data-hint':friends[friendID].name}, React.DOM.img( {className:"profilePic", src:"https://graph.facebook.com/" + friendID + "/picture", onClick:function () { return this.profileLink(friendID) }, alt:"friend picture"}));
    });

    var more = this.props.event.count - pics.length;
    if (more) {
      var moreFriends = Object.keys(friends).slice(5).map(function(friendID) {
        return friends[friendID].name;
      });
      var count = React.DOM.span( {className:"tooltip", 'data-hint':moreFriends.join("\n")}, React.DOM.div( {className:"profilePic count"}, "+" + more));
    };

    var invited = this.props.event.invited ? " Invited" : "";

    if (this.props.event.cover) {
      var backgroundStyle = {
        'background': 'url(' + this.props.event.cover + ')'    
      };
    }

    var name = this.props.event.name.length > 120 ? this.props.event.name.substring(0,120) + '. . .' : this.props.event.name;

    return (
      React.DOM.a( {href:"http://www.facebook.com/" + this.props.event.id, className:"Tableslip " + date.format('ddd') + invited}, 
        React.DOM.div( {className:"background", style:backgroundStyle} ),
        React.DOM.div( {className:"foreground"}, 
          React.DOM.div( {className:"name"}, name),
          React.DOM.div( {className:"group"}, this.props.event.parent_group),
          React.DOM.div( {className:"day"}, date.format('dddd MMMM Do')),
          React.DOM.div( {className:"time"}, date.format('h:mm a')),
          Rsvp( {eventID:this.props.event.id, rsvp_status:this.props.event.rsvp_status} ),
          React.DOM.div( {className:"friends"}, 
            React.DOM.div( {className:"facepile"}, 
              pics,
              count
            )
          )
        )
      )
    );
  }
});

module.exports = Tableslip;