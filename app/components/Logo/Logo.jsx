/** @jsx React.DOM */

var React = require('React');
var ArbiterMixin = require('mixins/ArbiterMixin');

var Logo = React.createClass({
  mixins: [ArbiterMixin],
  
  render: function () {
    return (
      <div class="Logo">
        Tableslip
      </div>
    );
  }
});

module.exports = Logo;