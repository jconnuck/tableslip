/** @jsx React.DOM */

var React = require('React');
var ArbiterMixin = require('mixins/ArbiterMixin');

var Keyword = require('Keyword');

var Filters = React.createClass({
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
      return <Keyword selected={selected} name={day} filter={this.filter}>{day}</Keyword>;
    }.bind(this));

    var keywords = ['Invited', 'Free', 'Movie', 'Party', 'Food', 'Art', 'Dance'].map(function (keyword) {
      var selected = this.state.selected.indexOf(keyword) != -1;
      return <Keyword selected={selected} name={keyword} filter={this.filter}>{keyword}</Keyword>;
    }.bind(this));

    return (
      <div class="Filters">
      <div class="keywords">
        {days}
      </div>
      <div class="clear" onClick={this.clear}></div>
      </div>
    );
  }
});

module.exports = Filters;