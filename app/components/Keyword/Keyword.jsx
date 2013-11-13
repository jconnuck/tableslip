/** @jsx React.DOM */

var React = require('React');
var ArbiterMixin = require('mixins/ArbiterMixin');

var Keyword = React.createClass({
  mixins: [ArbiterMixin],

  select: function () {
    this.props.filter(this.props.name, !this.props.selected);
  },

  render: function () {
    var selectedClass = this.props.selected ? " selected" : "";

    return (
      <div class={"Keyword" + selectedClass} onClick={this.select}>
      {this.props.children}
      </div>
    );
  }
});

module.exports = Keyword;