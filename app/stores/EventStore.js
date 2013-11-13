var Store = require('Store');
var Dispatcher = require('Dispatcher');

var EventStore = window.EventStore = new Store({name: 'events', record: 'event'}, function () {

  var serverEvents = function (data) {

    EventStore.nuke();

    data.events.map(function(event) {
      event.key = event.id;
    });

    EventStore.batch(data.events, function(events) {
      EventStore.publish('loadedEvents', {
        events: events
      });
    });
  };

  Dispatcher.subscribe('serverEvents', serverEvents);

  var cachedEvents = function (data) {
    EventStore.all(function(events) {
      EventStore.publish('loadedEvents', {
        events: events
      }, {persist: true});
    });

  };

  Dispatcher.subscribe('init', cachedEvents);

});

module.exports = EventStore;