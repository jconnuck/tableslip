/** @jsx React.DOM */

var React = require('React');
var ArbiterMixin = require('mixins/ArbiterMixin');

var Logo = require('Logo');
var Filters = require('Filters');

var EventStore = require('EventStore');

var Header = React.createClass({
  mixins: [ArbiterMixin],
  
  render: function () {
    return (
      <div class="Header">
        <Logo />
        <Filters />
        <div class="fb-login-button-wrapper">
          <div class="fb-login-button" data-size="icon" data-autologoutlink="true" data-scope="user_events, friends_events, rsvp_event"></div>
        </div>
      </div>
    );
  }
});

module.exports = Header;