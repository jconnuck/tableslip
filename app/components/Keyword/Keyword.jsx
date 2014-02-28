/** @jsx React.DOM */

var React = require('React');
var ArbiterMixin = require('mixins/ArbiterMixin');

var Keyword = React.createClass({
  mixins: [ArbiterMixin],

  select: function () {
    if (!this.props.disabled) {
      this.props.filter(this.props.name, !this.props.selected);
    }
  },

  render: function () {
    var disabled = this.props.disabled ? " disabled" : "";
    var selectedClass = this.props.selected ? " selected" : "";

    return (
      <div class={"Keyword" + selectedClass + disabled} onClick={this.select}>
      {this.props.children}
      </div>
    );
  }
});

module.exports = Keyword;