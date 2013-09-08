/** @jsx React.DOM */
var React = require('React');

var Application = React.createClass({
  render: function () {
    return (
      <div class="Application">
        Tableslip
      </div>
    );
  }
});

document.addEventListener("DOMContentLoaded", function() {
  React.renderComponent(
    <Application />, 
    document.getElementById('tableslip')
  );
});

module.exports = Application;