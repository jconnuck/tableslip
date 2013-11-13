var React = require('React');
var Application = require('Application');

var ComponentDispatcher = require('Arbiter').create();
var StoreComponent = require('Arbiter').create();
var DispatcherStore = require('Arbiter').create();

document.addEventListener("DOMContentLoaded", function() {
  React.renderComponent(
    Application(null ), 
    document.getElementById('tableslip')
  );
});