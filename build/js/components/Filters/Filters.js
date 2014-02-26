/** @jsx React.DOM */

var React = require('React');
var ArbiterMixin = require('mixins/ArbiterMixin');

var Keyword = require('Keyword');

var Filters = React.createClass({displayName: 'Filters',
  mixins: [ArbiterMixin],
  
  getInitialState: function () {
    return {
      selected: []
    };
  },

  clear: function () {
    this.setState({
      selected: []
    });

    $('.Events').isotope({ filter: ''});
  },

  filter: function(keyword, select) {
    var selected = this.state.selected.slice();

    if (select) {
      selected.push(keyword);     
    } else {
      selected.splice(selected.indexOf(keyword), 1);
    };

    this.setState({
      selected: selected
    }, function () {
      var $Events = $('.Events');
      if (this.state.selected.length) {
        var filters = '.' + this.state.selected.join(',.');
        $Events.isotope({ filter: filters });
      } else {
        $Events.isotope({ filter: ''});
      };
    });
  },

  render: function () {
    var days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(function (day) {
      var selected = this.state.selected.indexOf(day) != -1;
      return Keyword( {selected:selected, name:day, filter:this.filter}, day);
    }.bind(this));

    var keywords = ['Invited', 'Free', 'Movie', 'Party', 'Food', 'Art', 'Dance'].map(function (keyword) {
      var selected = this.state.selected.indexOf(keyword) != -1;
      return Keyword( {selected:selected, name:keyword, filter:this.filter}, keyword);
    }.bind(this));

    return (
      React.DOM.div( {className:"Filters"}, 
      React.DOM.div( {className:"keywords"}, 
        days
      ),
      React.DOM.div( {className:"clear", onClick:this.clear})
      )
    );
  }
});

module.exports = Filters;