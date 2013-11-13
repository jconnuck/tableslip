/** @jsx React.DOM */

var React = require('React');
var ArbiterMixin = require('mixins/ArbiterMixin');

var Logo = React.createClass({displayName: 'Logo',
  mixins: [ArbiterMixin],
  
  render: function () {
    return (
      React.DOM.div( {className:"Logo"}, 
" Tableslip "      )
    );
  }
});

module.exports = Logo;