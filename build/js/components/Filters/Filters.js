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

  componentDidMount: function () {
  },

  clear: function () {
    this.setState({
      selected: []
    });

    // this.iso = this.iso || Isotope.data(document.getElementsByClassName('Events')[0]);

    // this.iso.arrange({
    //   filter: ''
    // });
  },

  filter: function(keyword, select) {
    // this.iso = this.iso || Isotope.data(document.getElementsByClassName('Events')[0]);
    var selected = this.state.selected.slice();

    if (select) {
      selected.push(keyword);     
    } else {
      selected.splice(selected.indexOf(keyword), 1);
    };

    this.setState({
      selected: selected
    }, function () {
      if (this.state.selected.length) {
        var filters = '.' + this.state.selected.join(',.');
        // this.iso.arrange({
        //   filter: filters
        // });

      } else {
        this.clear();
      };
    });
  },

  render: function () {
    var today = (new Date()).getDay();
    var days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(function (day, i) {
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
      )
      // <div class="clear" onClick={this.clear}></div>
      )
    );
  }
});

module.exports = Filters;