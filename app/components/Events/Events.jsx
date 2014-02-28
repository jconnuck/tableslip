/** @jsx React.DOM */
var React = require('React');
var ArbiterMixin = require('mixins/ArbiterMixin');

var Tableslip = require('Tableslip');

var Events = React.createClass({
  mixins: [ArbiterMixin],

  componentDidMount: function () {
    var events = this.refs.Events.getDOMNode();
    this.iso = new Isotope(events, {
      isInitLayout: false,
      itemSelector: '.Tableslip',
      masonry: {
        isFitWidth: true
      }
    });

    this.refresh();
  },

  componentDidUpdate: function () {
    this.refresh();
  },

  refresh: function () {
    this.iso.arrange();
  },
  
  render: function () {

    var events = this.props.events.map(function(event) {
      return <Tableslip event={event}/>;
    });

    return (
      <div ref="Events" class="Events">
        {events}
      </div>
    );
  }
});

module.exports = Events;