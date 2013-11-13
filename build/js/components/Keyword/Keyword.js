/** @jsx React.DOM */

var React = require('React');
var ArbiterMixin = require('mixins/ArbiterMixin');

var Keyword = React.createClass({displayName: 'Keyword',
  mixins: [ArbiterMixin],

  select: function () {
    this.props.filter(this.props.name, !this.props.selected);
  },

  render: function () {
    var selectedClass = this.props.selected ? " selected" : "";

    return (
      React.DOM.div( {className:"Keyword" + selectedClass, onClick:this.select}, 
      this.props.children
      )
    );
  }
});

module.exports = Keyword;