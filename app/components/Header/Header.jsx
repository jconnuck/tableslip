/** @jsx React.DOM */

var React = require('React');
var ArbiterMixin = require('mixins/ArbiterMixin');

var Logo = require('Logo');
var Filters = require('Filters');

var Header = React.createClass({
  mixins: [ArbiterMixin],
  
  render: function () {
    return (
      <div class="Header">
        <div class="fb-login-button" data-width="200" data-autologoutlink="true" data-scope="user_events, friends_events, rsvp_event"></div>      
        <Logo />
        <Filters />
      </div>
    );
  }
});

module.exports = Header;