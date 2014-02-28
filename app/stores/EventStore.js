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
        cached: false,
        events: events
      });
    });
  };

  Dispatcher.subscribe('serverEvents', serverEvents);

  var cachedEvents = function (data) {
    EventStore.all(function(events) {
      EventStore.publish('loadedEvents', {
        cached: true,
        events: events
      }, {persist: true});
    });

  };

  Dispatcher.subscribe('init', cachedEvents);

  var rsvpUpdate = function (data) {
    var eventID = data.eventID;
    var rsvp_status = data.rsvp_status;

    FB.api('/' + eventID + '/' + rsvp_status, 'post', function (res) {
      // error if request didn't go through
    });

    EventStore.get(eventID, function (event) {
      event.rsvp_status = rsvp_status;

      EventStore.save(event, function () {
        Dispatcher.publish('rsvpUpdate/' + eventID, {
          rsvp_status: rsvp_status
        });
      });

    });

  };

  Dispatcher.subscribe('rsvp', rsvpUpdate)

  var logOut = function () {
    EventStore.nuke(function () {
      EventStore.publish('loadedEvents', {events:[]});
    });
  };

  var fbLoaded = function () {
    // Additional init code here
    FB.getLoginStatus(function (response) {
      EventStore.publish('loginChange', {
        loggedIn: response.status 
      });
    });

    FB.Event.subscribe('auth.authResponseChange', function (response) {
      EventStore.publish('loginChange', {
        loggedIn: response.status
      });

      if (response.status === 'connected') {

        var me = response.authResponse.userID;

        // Get user's friends events
        FB.api('/me?fields=friends.fields(name,events.type(attending).limit(10).fields(id,name,cover,start_time,rsvp_status,parent_group,invited.user(' + me + ')).since(now).until(next\%20week))', function(res) {
          var eventsAttending = {};
          res.friends.data.map(function (friend) {
            if (friend.events) {

              friend.events.data.forEach(function(event) {

                if (!eventsAttending[event.id]) {
                  var cover = event.cover ? event.cover.source : undefined;
                  var invited = event.invited;
                  var rsvp_status = invited ? invited.data[0].rsvp_status : false;
                  eventsAttending[event.id] = {
                    count: 0,
                    name: event.name,
                    cover: cover,
                    start_time: event.start_time,
                    invited: !!invited,
                    rsvp_status: rsvp_status,
                    friends: {}
                  };

                }

                eventsAttending[event.id].count += 1;
                eventsAttending[event.id].friends[friend.id] = friend;
              
              });

            }
          });

          var events = [];

          for (eventID in eventsAttending) {
            eventsAttending[eventID].id = eventID;
            events.push(eventsAttending[eventID]);
          };

          events.sort(function(a, b) {
            return b.count - a.count;
          });

          Dispatcher.publish('serverEvents', {
            events: events 
          });
        });
      } else if (response.status === 'not_authorized') {
        logOut();
        FB.login(function(response) {}, {scope: 'user_events, friends_events'});
      } else {
        logOut();
        FB.login(function(response) {}, {scope: 'user_events, friends_events'});       
      }
    });
  };

  Dispatcher.subscribe('FBLoaded', fbLoaded);

});

module.exports = EventStore;