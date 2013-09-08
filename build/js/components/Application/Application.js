/** @jsx React.DOM */
var React = require('React');

var Application = React.createClass({displayName: 'Application',
  render: function () {
    return (
      React.DOM.div( {className:"Application"}, 
" Tableslip "      )
    );
  }
});

document.addEventListener("DOMContentLoaded", function() {
  React.renderComponent(
    Application(null ), 
    document.getElementById('tableslip')
  );
});

module.exports = Application;