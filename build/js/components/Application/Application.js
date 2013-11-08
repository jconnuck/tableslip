/** @jsx React.DOM */
var React = require('React');
var ArbiterMixin = require('mixins/ArbiterMixin');

var Header = require('Header');
var Events = require('Events');

var EventStore = require('EventStore');

// TEST DATA
var data = [
  { "_id" : "516518ec870d1c55125acdc8", "name" : "Documentary Screening Series", "host" : "Ivy Film Festival", "fbEvent" : "258090834327497", "keywords" : [ "free", "movie" ] },
  { "_id" : "515deb2a866f75765879f6c2", "name" : "Welcome to the Jungle", "host" : "AEPi", "fbEvent" : "508263515875594", "keywords" : [ "party", "free" ] },
  { "_id" : "515deecd866f75765879f6c3", "name" : "Ivy Film Festival 2013", "host" : "Ivy Film Festival", "fbEvent" : "433862260037924", "keywords" : [ "free", "movie" ] },
  { "_id" : "5169802a3ecf3c0d0e438111", "name" : "48 Hour Film Festival 2013", "host" : "Ivy Film Festival", "fbEvent" : "296536593784581", "keywords" : [ "free", "movie", "competition" ] },
  { "_id" : "5169975d3ecf3c0d0e438112", "name" : "Periphery Art Show", "host" : "Artsy Seniors", "fbEvent" : "441666799250736", "keywords" : [ "free", "food", "art" ] },
  { "name" : "Spring Performance", "host" : "Brown Aerial Arts", "keywords" : [ "dance" ], "fbEvent" : "151452711696458", "_id" : "51745890af625a0000000002" },
  { "name" : "Outdoor Movie Night", "host" : "Ivy Film Festival", "keywords" : [ "movie", "free", "food" ], "fbEvent" : "640986642585371", "_id" : "51749721af625a0000000003" },
];

var Application = React.createClass({displayName: 'Application',
  mixins: [ArbiterMixin],

  getInitialState: function () {
    return {
      events: []
    };
  },

  componentWillMount: function () {
    this.publish('init', {});

    EventStore.subscribe('loadedEvents', this.loadedEvents);
  },

  loadedEvents: function (payload) {
    var events = payload.events.slice(0,40);
    this.setState({
      events: events
    });
  },
  
  render: function () {
    return (
      React.DOM.div( {className:"Application"}, 
        Header(null ),
        Events( {events:this.state.events})
      )
    );
  }
});

module.exports = Application;