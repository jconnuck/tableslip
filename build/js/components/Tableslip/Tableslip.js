/** @jsx React.DOM */

var React = require('React');
var ArbiterMixin = require('mixins/ArbiterMixin');

var Rsvp = require('Rsvp');

var Tableslip = React.createClass({displayName: 'Tableslip',
  mixins: [ArbiterMixin],
  
  render: function () {
    var date = moment(this.props.event.start_time);
    var pics = this.props.event.friendIDs.slice(0,3).map(function(friendID) {
      return React.DOM.img( {className:"profilePic", src:"https://graph.facebook.com/" + friendID + "/picture", alt:"friend picture"});
    });

    var more = this.props.event.count - pics.length;
    if (more) {
      var count = React.DOM.div( {className:"profilePic count"}, "+" + more)
    };

    var invited = this.props.event.invited ? " Invited" : "";

    if (this.props.event.cover) {
      var backgroundStyle = {
        'background': 'url(' + this.props.event.cover + ')'    
      };
    }

    return (
      React.DOM.a( {href:"http://www.facebook.com/" + this.props.event.id, className:"Tableslip " + date.format('ddd') + invited}, 
        React.DOM.div( {className:"background", style:backgroundStyle} ),
        React.DOM.div( {className:"foreground"}, 
          React.DOM.div( {className:"name"}, this.props.event.name),
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