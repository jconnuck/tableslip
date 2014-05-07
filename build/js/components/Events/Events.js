/** @jsx React.DOM */
var React = require('React');
var ArbiterMixin = require('mixins/ArbiterMixin');

var Tableslip = require('Tableslip');

var Events = React.createClass({displayName: 'Events',
  mixins: [ArbiterMixin],

  componentDidMount: function () {
    // var events = this.refs.Events.getDOMNode();
    // this.iso = new Isotope(events, {
    //   isInitLayout: false,
    //   itemSelector: '.Tableslip',
    //   masonry: {
    //     isFitWidth: true
    //   }
    // });

    this.refresh();
  },

  componentDidUpdate: function () {
    this.refresh();
  },

  refresh: function () {
    // this.iso.reloadItems();
    // this.iso.arrange();
  },
  
  render: function () {

    var events = this.props.events.map(function(event) {
      return Tableslip( {event:event});
    });

    return (
      React.DOM.div( {ref:"Events", className:"Events"}, 
        events
      )
    );
  }
});

module.exports = Events;