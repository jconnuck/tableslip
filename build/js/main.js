require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"4vB33x":[function(require,module,exports){
/** @jsx React.DOM */

var Components = require('Arbiter');
var Store = require('Store');

/** hooks react components into to pub/sub events */

var ArbiterMixin = {
  publish: Components.publish
};

module.exports = ArbiterMixin;
},{"Arbiter":"cWvVP8","Store":"56S4uO"}],"cWvVP8":[function(require,module,exports){
/*
Arbiter.js
	by Matt Kruse 
	http://ArbiterJS.com - See site for documentation
Dual licensed under the MIT and GPL licenses.
*/
var Arbiter = (function () {
	var create_arbiter = function () {
		var subscriptions = {};
		var wildcard_subscriptions = {};
		var persistent_messages = {};
		var id_lookup = {};
		var new_id = 1;
		return {
			'version':'1.0'
			,'updated_on':'2011-12-19'
			,'create': function() { return create_arbiter(); }
			,'subscribe': function() {
				var msg, messages, subscription_list, persisted_subscription_list, subscription, func, options={}, context, wildcard=false, priority=0, id, return_ids=[];
				if (arguments.length<2) { return null; }
				messages = arguments[0];
				func = arguments[arguments.length-1]; // Function is always last argument
				if (arguments.length>2) { options = arguments[1] || {}; }
				if (arguments.length>3) { context = arguments[2]; }

				if (options.priority) {
					priority = options.priority;
				}
				if (typeof messages=="string") {
					messages = messages.split(/[,\s]+/);
				}
				for (var i=0; i<messages.length; i++) {
					msg = messages[i];
					// If the message ends in *, it's a wildcard subscription
					if (/\*$/.test(msg)) {
						wildcard = true;
						msg = msg.replace(/\*$/,'');
						subscription_list = wildcard_subscriptions[msg];				
						if (!subscription_list) {
							wildcard_subscriptions[msg] = subscription_list = [];
						}
					}
					else {
						subscription_list = subscriptions[msg];				
						if (!subscription_list) {
							subscriptions[msg] = subscription_list = [];
						}
					}
					id = new_id++;
					subscription = {'id':id,'f':func,p:priority,self:context,'options':options};
					id_lookup[id] = subscription;
					subscription_list.push ( subscription );
					// Sort the list by priority
					subscription_list = subscription_list.sort( function(a,b) {
						return (a.p>b.p?-1:a.p==b.p?0:1);
					} );
					// Put it back in after sorting
					if (wildcard) {
						wildcard_subscriptions[msg] = subscription_list;
					}
					else {
						subscriptions[msg] = subscription_list;
					}
					return_ids.push(id);
					
					// Check to see if there are any persistent messages that need
					// to be fired immediately
					if (!options.persist && persistent_messages[msg]) {
						persisted_subscription_list = persistent_messages[msg];
						for (var j=0; j<persisted_subscription_list.length; j++) {
							subscription.f.call( subscription.self, persisted_subscription_list[j], {persist:true} );
						}
					}
				}
				// Return an array of id's, or just 1
				if (messages.length>0) {
					return return_ids;
				}
				return return_ids[0];
			}
			
			,'publish': function(msg, data, options) {
				var async_timeout=10,result,overall_result=true,cancelable=true,internal_data={},subscriber, wildcard_msg;
				var subscription_list = subscriptions[msg] || [];
				options = options || {};
				// Look through wildcard subscriptions to find any that apply
				for (wildcard_msg in wildcard_subscriptions) {
					if (msg.indexOf(wildcard_msg)==0) {
						subscription_list = subscription_list.concat( wildcard_subscriptions[wildcard_msg] );
					}
				}
				if (options.persist===true) {
					if (!persistent_messages[msg]) {
						persistent_messages[msg] = [];
					}
					persistent_messages[msg].push( data );
				}
				if (subscription_list.length==0) { 
					return overall_result; 
				}
				if (typeof options.cancelable=="boolean") {
					cancelable = options.cancelable;
				}
				for (var i=0; i<subscription_list.length; i++) {
					subscriber = subscription_list[i];
					if (subscriber.unsubscribed) { 
						continue; // Ignore unsubscribed listeners
					}
					try {
						// Publisher OR subscriber may request async
						if (options.async===true || (subscriber.options && subscriber.options.async)) {
							setTimeout( (function(inner_subscriber) {
								return function() {
									inner_subscriber.f.call( inner_subscriber.self, data, msg, internal_data );
								};
							})(subscriber), async_timeout++ );
						}
						else {
							result = subscriber.f.call( subscriber.self, data, msg, internal_data );
							if (cancelable && result===false) {
								break;
							}
						}
					}
					catch(e) {
						overall_result = false;
					}
				}
				return overall_result;
			}
			
			,'unsubscribe': function(id) {
				if (id_lookup[id]) {
					 id_lookup[id].unsubscribed = true;
					 return true;
				}
				return false;
			}
			
			,'resubscribe': function(id) {
				if (id_lookup[id]) {
					 id_lookup[id].unsubscribed = false;
					 return true;
				}
				return false;
			}
			
		};
	};
	return create_arbiter();
	
})();

module.exports = Arbiter;

},{}],"Jxf8r5":[function(require,module,exports){
var Arbiter = require('Arbiter');

var Dispatcher = Arbiter.create();
var Components = Arbiter;

var sockjs = window.sockjs = new SockJS('/sock');

var Sources = {
  USER: 'USER',
  SERVER: 'SERVER'
}

var dispatchUserEvent = function(publisherData, message, subscriberData) {
  publisherData.source = Sources.USER;
  Dispatcher.publish(message, publisherData);
};

var dispatchServerEvent = function(e) {
  if (sockjs.readyState === SockJS.OPEN, e.type === 'message') {
    var data = JSON.parse(e.data);
    var message = data.message;
    var payload = data.payload;
    Dispatcher.publish(message, payload);
  };
};

// listen to user actions
Components.subscribe('*', dispatchUserEvent);

// listen to server actions
sockjs.onmessage = dispatchServerEvent;

module.exports = Dispatcher;

},{"Arbiter":"cWvVP8"}],"HPHWXz":[function(require,module,exports){
/**
 * Lawnchair!
 * --- 
 * clientside json store 
 *
 */
var Lawnchair = function (options, callback) {
    // ensure Lawnchair was called as a constructor
    if (!(this instanceof Lawnchair)) return new Lawnchair(options, callback);

    // lawnchair requires json 
    if (!JSON) throw 'JSON unavailable! Include http://www.json.org/json2.js to fix.'
    // options are optional; callback is not
    if (arguments.length <= 2) {
        callback = (typeof arguments[0] === 'function') ? arguments[0] : arguments[1];
        options  = (typeof arguments[0] === 'function') ? {} : arguments[0] || {};
    } else {
        throw 'Incorrect # of ctor args!'
    }
    
    // default configuration 
    this.record = options.record || 'record'  // default for records
    this.name   = options.name   || 'records' // default name for underlying store
    
    // mixin first valid  adapter
    var adapter
    // if the adapter is passed in we try to load that only
    if (options.adapter) {
        
        // the argument passed should be an array of prefered adapters
        // if it is not, we convert it
        if(typeof(options.adapter) === 'string'){
            options.adapter = [options.adapter];    
        }
            
        // iterates over the array of passed adapters 
        for(var j = 0, k = options.adapter.length; j < k; j++){
            
            // itirates over the array of available adapters
            for (var i = Lawnchair.adapters.length-1; i >= 0; i--) {
                if (Lawnchair.adapters[i].adapter === options.adapter[j]) {
                    adapter = Lawnchair.adapters[i].valid() ? Lawnchair.adapters[i] : undefined;
                    if (adapter) break 
                }
            }
            if (adapter) break
        }
    
    // otherwise find the first valid adapter for this env
    } 
    else {
        for (var i = 0, l = Lawnchair.adapters.length; i < l; i++) {
            adapter = Lawnchair.adapters[i].valid() ? Lawnchair.adapters[i] : undefined
            if (adapter) break 
        }
    } 
    
    // we have failed 
    if (!adapter) throw 'No valid adapter.' 
    
    // yay! mixin the adapter 
    for (var j in adapter)  
        this[j] = adapter[j]
    
    // call init for each mixed in plugin
    for (var i = 0, l = Lawnchair.plugins.length; i < l; i++) 
        Lawnchair.plugins[i].call(this)

    // init the adapter 
    this.init(options, callback)
}

Lawnchair.adapters = [] 

/** 
 * queues an adapter for mixin
 * ===
 * - ensures an adapter conforms to a specific interface
 *
 */
Lawnchair.adapter = function (id, obj) {
    // add the adapter id to the adapter obj
    // ugly here for a  cleaner dsl for implementing adapters
    obj['adapter'] = id
    // methods required to implement a lawnchair adapter 
    var implementing = 'adapter valid init keys save batch get exists all remove nuke'.split(' ')
    ,   indexOf = this.prototype.indexOf
    // mix in the adapter   
    for (var i in obj) {
        if (indexOf(implementing, i) === -1) throw 'Invalid adapter! Nonstandard method: ' + i
    }
    // if we made it this far the adapter interface is valid 
	// insert the new adapter as the preferred adapter
	Lawnchair.adapters.splice(0,0,obj)
}

Lawnchair.plugins = []

/**
 * generic shallow extension for plugins
 * ===
 * - if an init method is found it registers it to be called when the lawnchair is inited 
 * - yes we could use hasOwnProp but nobody here is an asshole
 */ 
Lawnchair.plugin = function (obj) {
    for (var i in obj) 
        i === 'init' ? Lawnchair.plugins.push(obj[i]) : this.prototype[i] = obj[i]
}

/**
 * helpers
 *
 */
Lawnchair.prototype = {

    isArray: Array.isArray || function(o) { return Object.prototype.toString.call(o) === '[object Array]' },
    
    /**
     * this code exists for ie8... for more background see:
     * http://www.flickr.com/photos/westcoastlogic/5955365742/in/photostream
     */
    indexOf: function(ary, item, i, l) {
        if (ary.indexOf) return ary.indexOf(item)
        for (i = 0, l = ary.length; i < l; i++) if (ary[i] === item) return i
        return -1
    },

    // awesome shorthand callbacks as strings. this is shameless theft from dojo.
    lambda: function (callback) {
        return this.fn(this.record, callback)
    },

    // first stab at named parameters for terse callbacks; dojo: first != best // ;D
    fn: function (name, callback) {
        return typeof callback == 'string' ? new Function(name, callback) : callback
    },

    // returns a unique identifier (by way of Backbone.localStorage.js)
    // TODO investigate smaller UUIDs to cut on storage cost
    uuid: function () {
        var S4 = function () {
            return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
        }
        return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
    },

    // a classic iterator
    each: function (callback) {
        var cb = this.lambda(callback)
        // iterate from chain
        if (this.__results) {
            for (var i = 0, l = this.__results.length; i < l; i++) cb.call(this, this.__results[i], i) 
        }  
        // otherwise iterate the entire collection 
        else {
            this.all(function(r) {
                for (var i = 0, l = r.length; i < l; i++) cb.call(this, r[i], i)
            })
        }
        return this
    }
// --
};

/**
 * Expose nodeJS module
 */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Lawnchair;
}
// window.name code courtesy Remy Sharp: http://24ways.org/2009/breaking-out-the-edges-of-the-browser
Lawnchair.adapter('window-name', (function() {
    if (typeof window==='undefined') {
        window = { top: { } }; // node/optimizer compatibility
    }

    // edited from the original here by elsigh
    // Some sites store JSON data in window.top.name, but some folks (twitter on iPad)
    // put simple strings in there - we should make sure not to cause a SyntaxError.
    var data = {}
    try {
        data = JSON.parse(window.top.name)    
    } catch (e) {}
    
    
    return {

        valid: function () {
            return typeof window.top.name != 'undefined' 
        },

        init: function (options, callback) {
            data[this.name] = data[this.name] || {index:[],store:{}}
            this.index = data[this.name].index
            this.store = data[this.name].store
            this.fn(this.name, callback).call(this, this)
            return this
        },

        keys: function (callback) {
            this.fn('keys', callback).call(this, this.index)
            return this
        },

        save: function (obj, cb) {
            // data[key] = value + ''; // force to string
            // window.top.name = JSON.stringify(data);
            var key = obj.key || this.uuid()
            this.exists(key, function(exists) {
                if (!exists) {
                    if (obj.key) delete obj.key
                    this.index.push(key)
                }
                this.store[key] = obj

                try {
                    window.top.name = JSON.stringify(data) // TODO wow, this is the only diff from the memory adapter
                } catch(e) {
                    // restore index/store to previous value before JSON exception
                    if (!exists) {
                        this.index.pop();
                        delete this.store[key];
                    }
                    throw e;
                }

                if (cb) {
                    obj.key = key
                    this.lambda(cb).call(this, obj)
                }
            })
            return this
        },

        batch: function (objs, cb) {
            var r = []
            for (var i = 0, l = objs.length; i < l; i++) {
                this.save(objs[i], function(record) {
                    r.push(record)
                })
            }
            if (cb) this.lambda(cb).call(this, r)
            return this
        },
        
        get: function (keyOrArray, cb) {
            var r;
            if (this.isArray(keyOrArray)) {
                r = []
                for (var i = 0, l = keyOrArray.length; i < l; i++) {
                    r.push(this.store[keyOrArray[i]])
                }
            } else {
                r = this.store[keyOrArray]
                if (r) r.key = keyOrArray
            }
            if (cb) this.lambda(cb).call(this, r)
            return this 
        },
        
        exists: function (key, cb) {
            this.lambda(cb).call(this, !!(this.store[key]))
            return this
        },

        all: function (cb) {
            var r = []
            for (var i = 0, l = this.index.length; i < l; i++) {
                var obj = this.store[this.index[i]]
                obj.key = this.index[i]
                r.push(obj)
            }
            this.fn(this.name, cb).call(this, r)
            return this
        },
        
        remove: function (keyOrArray, cb) {
            var del = this.isArray(keyOrArray) ? keyOrArray : [keyOrArray]
            for (var i = 0, l = del.length; i < l; i++) {
                var key = del[i].key ? del[i].key : del[i]
                var where = this.indexOf(this.index, key)
                if (where < 0) continue /* key not present */
                delete this.store[key]
                this.index.splice(where, 1)
            }
            window.top.name = JSON.stringify(data)
            if (cb) this.lambda(cb).call(this)
            return this
        },

        nuke: function (cb) {
            this.store = data[this.name].store = {}
            this.index = data[this.name].index = []
            window.top.name = JSON.stringify(data)
            if (cb) this.lambda(cb).call(this)
            return this
        }
    }
/////
})());
/**
 * dom storage adapter 
 * === 
 * - originally authored by Joseph Pecoraro
 *
 */ 
//
// TODO does it make sense to be chainable all over the place?
// chainable: nuke, remove, all, get, save, all    
// not chainable: valid, keys
//
Lawnchair.adapter('dom', (function() {
    var storage = window.localStorage
    // the indexer is an encapsulation of the helpers needed to keep an ordered index of the keys
    var indexer = function(name) {
        return {
            // the key
            key: name + '._index_',
            // returns the index
            all: function() {
				var a  = storage.getItem(JSON.stringify(this.key))
				if (a) {
					a = JSON.parse(a)
				}
                if (a === null) storage.setItem(JSON.stringify(this.key), JSON.stringify([])) // lazy init
                return JSON.parse(storage.getItem(JSON.stringify(this.key)))
            },
            // adds a key to the index
            add: function (key) {
                var a = this.all()
                a.push(key)
                storage.setItem(JSON.stringify(this.key), JSON.stringify(a))
            },
            // deletes a key from the index
            del: function (key) {
                var a = this.all(), r = []
                // FIXME this is crazy inefficient but I'm in a strata meeting and half concentrating
                for (var i = 0, l = a.length; i < l; i++) {
                    if (a[i] != key) r.push(a[i])
                }
                storage.setItem(JSON.stringify(this.key), JSON.stringify(r))
            },
            // returns index for a key
            find: function (key) {
                var a = this.all()
                for (var i = 0, l = a.length; i < l; i++) {
                    if (key === a[i]) return i 
                }
                return false
            }
        }
    }
    
    // adapter api 
    return {
    
        // ensure we are in an env with localStorage 
        valid: function () {
            return !!storage && function() {
              // in mobile safari if safe browsing is enabled, window.storage
              // is defined but setItem calls throw exceptions.
              var success = true
              var value = Math.random()
              try {
                storage.setItem(value, value)
              } catch (e) {
                success = false
              }
              storage.removeItem(value)
              return success
            }()
        },

        init: function (options, callback) {
            this.indexer = indexer(this.name)
            if (callback) this.fn(this.name, callback).call(this, this)  
        },
        
        save: function (obj, callback) {
            var key = obj.key ? this.name + '.' + obj.key : this.name + '.' + this.uuid()
            // now we kil the key and use it in the store colleciton    
            delete obj.key;
            storage.setItem(key, JSON.stringify(obj))
            // if the key is not in the index push it on
            if (this.indexer.find(key) === false) this.indexer.add(key)
            obj.key = key.slice(this.name.length + 1)
            if (callback) {
                this.lambda(callback).call(this, obj)
            }
            return this
        },

        batch: function (ary, callback) {
            var saved = []
            // not particularily efficient but this is more for sqlite situations
            for (var i = 0, l = ary.length; i < l; i++) {
                this.save(ary[i], function(r){
                    saved.push(r)
                })
            }
            if (callback) this.lambda(callback).call(this, saved)
            return this
        },
       
        // accepts [options], callback
        keys: function(callback) {
            if (callback) {
                var name = this.name
                var indices = this.indexer.all();
                var keys = [];
                //Checking for the support of map.
                if(Array.prototype.map) {
                    keys = indices.map(function(r){ return r.replace(name + '.', '') })
                } else {
                    for (var key in indices) {
                        keys.push(key.replace(name + '.', ''));
                    }
                }
                this.fn('keys', callback).call(this, keys)
            }
            return this // TODO options for limit/offset, return promise
        },
        
        get: function (key, callback) {
            if (this.isArray(key)) {
                var r = []
                for (var i = 0, l = key.length; i < l; i++) {
                    var k = this.name + '.' + key[i]
                    var obj = storage.getItem(k)
                    if (obj) {
						obj = JSON.parse(obj)
                        obj.key = key[i]
                    } 
                    r.push(obj)
                }
                if (callback) this.lambda(callback).call(this, r)
            } else {
                var k = this.name + '.' + key
                var  obj = storage.getItem(k)
                if (obj) {
					obj = JSON.parse(obj)
					obj.key = key
				}
                if (callback) this.lambda(callback).call(this, obj)
            }
            return this
        },

        exists: function (key, cb) {
            var exists = this.indexer.find(this.name+'.'+key) === false ? false : true ;
            this.lambda(cb).call(this, exists);
            return this;
        },
        // NOTE adapters cannot set this.__results but plugins do
        // this probably should be reviewed
        all: function (callback) {
            var idx = this.indexer.all()
            ,   r   = []
            ,   o
            ,   k
            for (var i = 0, l = idx.length; i < l; i++) {
                k     = idx[i] //v
                o     = JSON.parse(storage.getItem(k))
                o.key = k.replace(this.name + '.', '')
                r.push(o)
            }
            if (callback) this.fn(this.name, callback).call(this, r)
            return this
        },
        
        remove: function (keyOrArray, callback) {
            var self = this;
            if (this.isArray(keyOrArray)) {
                // batch remove
                var i, done = keyOrArray.length;
                var removeOne = function(i) {
                    self.remove(keyOrArray[i], function() {
                        if ((--done) > 0) { return; }
                        if (callback) {
                            self.lambda(callback).call(self);
                        }
                    });
                };
                for (i=0; i < keyOrArray.length; i++)
                    removeOne(i);
                return this;
            }
            var key = this.name + '.' +
                ((keyOrArray.key) ? keyOrArray.key : keyOrArray)
            this.indexer.del(key)
            storage.removeItem(key)
            if (callback) this.lambda(callback).call(this)
            return this
        },
        
        nuke: function (callback) {
            this.all(function(r) {
                for (var i = 0, l = r.length; i < l; i++) {
                    this.remove(r[i]);
                }
                if (callback) this.lambda(callback).call(this)
            })
            return this 
        }
}})());
Lawnchair.plugin({
    
    // count of rows in the lawnchair collection with property
    count: function (property, callback) {
        // if only one arg we count the collection
        if ([].slice.call(arguments).length === 1) {
            callback = property 
            property = 'key'
        } 
        var c = 0 
        this.each(function(e){
            if (e[property]) c++
        })
        this.fn('count', callback).call(this, c)
    },
    
    // adds up property and returns sum
    sum: function (property, callback) {
        var sum = 0
        this.each(function(e){
            if (e[property]) sum += e[property]
        })
        this.fn('sum', callback).call(this, sum)
    },

    // averages a property 
    avg: function (property, callback) {
        this.sum(property, function (sum) {
            this.count(property, function (count) {
                this.fn('avg', callback).call(this, sum/count)
            })
        })
    },

    // lowest number
    min: function (property, callback) {
        this._minOrMax('min', property, callback)
    },

    // highest number
    max: function (property, callback) {
        this._minOrMax('max', property, callback)
    },

    // helper for min/max
    _minOrMax: function (m, p, c) {
        var r, all
        this.all(function(a){
            all = a.map(function(e){ return e[p] })
            r = Math[m].apply(Math, all)
        })
        this.fn(m, c).call(this, r)
    }
// --
});
// - NOT jsonPath or jsonQuery which are horrendously complex and fugly
// - simple query syntax 'its just javascript'
// - simple string interpolation 
// - search then sorting
Lawnchair.plugin((function(){        
    // 
    var interpolate = function(template, args) {
        var parts = template.split('?').filter(function(i) { return i != ''})
        ,   query = ''

        for (var i = 0, l = parts.length; i < l; i++) {
            var a = typeof args[i] === "string" ? '"' + args[i] + '"' : args[i]
            query += parts[i] + a    
        }
        return query
    }
     
    var sorter = function(p) {
        return function(a, b) {
            if (a[p] < b[p]) return -1
            if (a[p] > b[p]) return 1
            return 0
        }
    }
    //
    return {
        // query the storage obj
        where: function() {
            // ever notice we do this sort thing lots?
            var args = [].slice.call(arguments)
            ,   tmpl = args.shift()
            ,   last = args[args.length - 1]
            ,   qs   = tmpl.match(/\?/g)
            ,   q    = qs && qs.length > 0 ? interpolate(tmpl, args.slice(0, qs.length)) : tmpl
            ,   is   = new Function(this.record, 'return !!(' + q + ')')
            ,   r    = []
            ,   cb


            // iterate the entire collection
            // TODO should we allow for chained where() to filter __results? (I'm thinking no b/c creates funny behvaiors w/ callbacks)
            this.all(function(all){
                for (var i = 0, l = all.length; i < l; i++) {
                    if (is.call(all[i], all[i])) r.push(all[i])
                }
                // overwrite working results
                this.__results = r
                // callback / chain
                if (args.length >= 1) this.fn(this.name, last).call(this, this.__results)   
            })
            return this 
        },  

	    // FIXME should be able to call without this.__results	
        // ascending sort the working storage obj on a property (or nested property)
        asc: function(property, callback) {
            this.fn(this.name, callback).call(this, this.__results.sort(sorter(property))) 
            return this
        },

        // descending sort on working storage object on a property 
        desc: function(property, callback) {
            this.fn(this.name, callback).call(this, this.__results.sort(sorter(property)).reverse())
            return this
        }
    } 
///// 
})())
// I would mark my relationship with javascript as 'its complicated'
Lawnchair.plugin((function(){
    
    // methods we want to augment with before/after callback registery capability 
    var methods = 'save batch get remove nuke'.split(' ')
    ,   registry = {before:{}, after:{}}
    
    // fill in the blanks
    for (var i = 0, l = methods.length; i < l; i++) {
        registry.before[methods[i]] = []
        registry.after[methods[i]] = []
    }

    return {
    // start of module 
        
        // roll thru each method we with to augment
        init: function () {
            for (var i = 0, l = methods.length; i < l; i++) {
                this.evented(methods[i])
            }
        },
        // TODO make private?
        // rewrites a method with before/after callback capability
        evented: function (methodName) {
            var oldy = this[methodName], self = this
            // overwrite the orig method
            this[methodName] = function() {
                var args              = [].slice.call(arguments)
                ,   beforeObj         = args[0] 
                ,   oldCallback       = args[args.length - 1]
                ,   overwroteCallback = false
                
                // call before with obj
                this.fire('before', methodName, beforeObj)

                if (typeof oldCallback === 'function') {
                    // overwrite final callback with after method injection 
                    args[args.length - 1] = function(record) {
                        oldCallback.call(self, record)
                        self.fire('after', methodName, record)
                    }
                    overwroteCallback = true
                }

                // finally call the orig method
                oldy.apply(self, args)

                // if there was no callback to override for after we invoke here
                if (!overwroteCallback) 
                    self.fire('after', methodName, beforeObj)
            }
        },

        // TODO definitely make private method 
        // for invoking callbacks
        fire: function (when, methodName, record) {
            var callbacks = registry[when][methodName]
            for (var i = 0, l = callbacks.length; i < l; i++) {
                callbacks[i].call(this, record)
            }
        },

        // TODO cleanup duplication that starts here..
        clearBefore: function(methodName) {
            registry.before[methodName] = []
        },

        clearAfter: function(methodName) {
            registry.after[methodName] = []
        },

        // register before callback for methodName
        before: function (methodName, callback) {
            registry.before[methodName].push(callback)
        },

        // register after callback for methodName 
        after: function (methodName, callback) {
            registry.after[methodName].push(callback)
        }
    
    // end module
    }
})())

/*
var p = new Lawnchair({name:'people', record:'person'}, function() {
 
    People = this

    People.page(2, function (page) {
        // scoped iterator
        this.each('console.log(person)')
        // also correctly scoped callback data
        console.log(page.people) 
        console.log(page.max)
        console.log(page.next)
        console.log(page.prev)
    })
})
// chaining friendly
p.page(1, 'console.log(page.people)').each('console.log(person)')
*/ 
Lawnchair.plugin({

    page: function (page, callback) {
        // some defaults
	    var objs  = []
	    ,   count = 5 // TODO make this configurable
	    ,   cur   = ~~page || 1
	    ,   next  = cur + 1
	    ,   prev  = cur - 1
	    ,   start = cur == 1 ? 0 : prev*count
	    ,   end   = start >= count ? start+count : count
              
        // grab all the records	
        // FIXME if this was core we could use this.__results for faster queries
		this.all(function(r){
	 		objs = r
 		})
        
        // grab the metadata	
        var max  = Math.ceil(objs.length/count)
	    ,   page = { max: max 
	               , next: next > max ? max : next
	               , prev: prev == 0 ? 1 : prev
	               }

        // reassign to the working resultset
        this.__results = page[this.name] = objs.slice(start, end)

        // callback / chain
        if (callback) this.fn('page', callback).call(this, page)
        return this
	}
});

},{}],"56S4uO":[function(require,module,exports){
var Arbiter = require('Arbiter').create();
var Store = require('Lawnchair');

// register to a dispatcher event

Store.prototype.publish = Arbiter.publish;
Store.prototype.subscribe = Arbiter.subscribe;
Store.prototype.unsubscribe = Arbiter.unsubscribe;

module.exports = Store;
},{"Arbiter":"cWvVP8","Lawnchair":"HPHWXz"}],"1zpOES":[function(require,module,exports){
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
},{"Application":"WLDCvt","Arbiter":"cWvVP8","React":"53xxmY"}],"9iYy0C":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule $
 * @typechecks
 */

var ge = require("./ge");
var ex = require("./ex");

/**
 * Find a node by ID.
 *
 * If your application code depends on the existence of the element, use $,
 * which will throw if the element doesn't exist.
 *
 * If you're not sure whether or not the element exists, use ge instead, and
 * manually check for the element's existence in your application code.
 *
 * @param {string|DOMDocument|DOMElement|DOMTextNode|Comment} id
 * @return {DOMDocument|DOMElement|DOMTextNode|Comment}
 */
function $(id) {
  var element = ge(id);
  if (!element) {
    throw new Error(ex(
      'Tried to get element with id of "%s" but it is not present on the page.',
      id
    ));
  }
  return element;
}

module.exports = $;

},{"./ex":"bHKEgX","./ge":"7THwY4"}],"sWBULG":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule CSSProperty
 */

"use strict";

/**
 * CSS properties which accept numbers but are not in units of "px".
 */
var isUnitlessNumber = {
  fillOpacity: true,
  fontWeight: true,
  opacity: true,
  orphans: true,
  zIndex: true,
  zoom: true
};

/**
 * Most style properties can be unset by doing .style[prop] = '' but IE8
 * doesn't like doing that with shorthand properties so for the properties that
 * IE8 breaks on, which are listed here, we instead unset each of the
 * individual properties. See http://bugs.jquery.com/ticket/12385.
 * The 4-value 'clock' properties like margin, padding, border-width seem to
 * behave without any problems. Curiously, list-style works too without any
 * special prodding.
 */
var shorthandPropertyExpansions = {
  background: {
    backgroundImage: true,
    backgroundPosition: true,
    backgroundRepeat: true,
    backgroundColor: true
  },
  border: {
    borderWidth: true,
    borderStyle: true,
    borderColor: true
  },
  borderBottom: {
    borderBottomWidth: true,
    borderBottomStyle: true,
    borderBottomColor: true
  },
  borderLeft: {
    borderLeftWidth: true,
    borderLeftStyle: true,
    borderLeftColor: true
  },
  borderRight: {
    borderRightWidth: true,
    borderRightStyle: true,
    borderRightColor: true
  },
  borderTop: {
    borderTopWidth: true,
    borderTopStyle: true,
    borderTopColor: true
  },
  font: {
    fontStyle: true,
    fontVariant: true,
    fontWeight: true,
    fontSize: true,
    lineHeight: true,
    fontFamily: true
  }
};

var CSSProperty = {
  isUnitlessNumber: isUnitlessNumber,
  shorthandPropertyExpansions: shorthandPropertyExpansions
};

module.exports = CSSProperty;

},{}],"BlPn6+":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule CSSPropertyOperations
 * @typechecks static-only
 */

"use strict";

var CSSProperty = require("./CSSProperty");

var dangerousStyleValue = require("./dangerousStyleValue");
var escapeTextForBrowser = require("./escapeTextForBrowser");
var hyphenate = require("./hyphenate");
var memoizeStringOnly = require("./memoizeStringOnly");

var processStyleName = memoizeStringOnly(function(styleName) {
  return escapeTextForBrowser(hyphenate(styleName));
});

/**
 * Operations for dealing with CSS properties.
 */
var CSSPropertyOperations = {

  /**
   * Serializes a mapping of style properties for use as inline styles:
   *
   *   > createMarkupForStyles({width: '200px', height: 0})
   *   "width:200px;height:0;"
   *
   * Undefined values are ignored so that declarative programming is easier.
   *
   * @param {object} styles
   * @return {?string}
   */
  createMarkupForStyles: function(styles) {
    var serialized = '';
    for (var styleName in styles) {
      if (!styles.hasOwnProperty(styleName)) {
        continue;
      }
      var styleValue = styles[styleName];
      if (styleValue != null) {
        serialized += processStyleName(styleName) + ':';
        serialized += dangerousStyleValue(styleName, styleValue) + ';';
      }
    }
    return serialized || null;
  },

  /**
   * Sets the value for multiple styles on a node.  If a value is specified as
   * '' (empty string), the corresponding style property will be unset.
   *
   * @param {DOMElement} node
   * @param {object} styles
   */
  setValueForStyles: function(node, styles) {
    var style = node.style;
    for (var styleName in styles) {
      if (!styles.hasOwnProperty(styleName)) {
        continue;
      }
      var styleValue = dangerousStyleValue(styleName, styles[styleName]);
      if (styleValue) {
        style[styleName] = styleValue;
      } else {
        var expansion = CSSProperty.shorthandPropertyExpansions[styleName];
        if (expansion) {
          // Shorthand property that IE8 won't like unsetting, so unset each
          // component to placate it
          for (var individualStyleName in expansion) {
            style[individualStyleName] = '';
          }
        } else {
          style[styleName] = '';
        }
      }
    }
  }

};

module.exports = CSSPropertyOperations;

},{"./CSSProperty":"sWBULG","./dangerousStyleValue":"vbLjBj","./escapeTextForBrowser":"ZaIegL","./hyphenate":"lqHdFC","./memoizeStringOnly":"w+d2Nh"}],"L1h3na":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule CallbackRegistry
 * @typechecks static-only
 */

"use strict";

var listenerBank = {};

/**
 * Stores "listeners" by `registrationName`/`id`. There should be at most one
 * "listener" per `registrationName`/`id` in the `listenerBank`.
 *
 * Access listeners via `listenerBank[registrationName][id]`.
 *
 * @class CallbackRegistry
 * @internal
 */
var CallbackRegistry = {

  /**
   * Stores `listener` at `listenerBank[registrationName][id]`. Is idempotent.
   *
   * @param {string} id ID of the DOM element.
   * @param {string} registrationName Name of listener (e.g. `onClick`).
   * @param {?function} listener The callback to store.
   */
  putListener: function(id, registrationName, listener) {
    var bankForRegistrationName =
      listenerBank[registrationName] || (listenerBank[registrationName] = {});
    bankForRegistrationName[id] = listener;
  },

  /**
   * @param {string} id ID of the DOM element.
   * @param {string} registrationName Name of listener (e.g. `onClick`).
   * @return {?function} The stored callback.
   */
  getListener: function(id, registrationName) {
    var bankForRegistrationName = listenerBank[registrationName];
    return bankForRegistrationName && bankForRegistrationName[id];
  },

  /**
   * Deletes a listener from the registration bank.
   *
   * @param {string} id ID of the DOM element.
   * @param {string} registrationName Name of listener (e.g. `onClick`).
   */
  deleteListener: function(id, registrationName) {
    var bankForRegistrationName = listenerBank[registrationName];
    if (bankForRegistrationName) {
      delete bankForRegistrationName[id];
    }
  },

  /**
   * Deletes all listeners for the DOM element with the supplied ID.
   *
   * @param {string} id ID of the DOM element.
   */
  deleteAllListeners: function(id) {
    for (var registrationName in listenerBank) {
      delete listenerBank[registrationName][id];
    }
  },

  /**
   * This is needed for tests only. Do not use!
   */
  __purge: function() {
    listenerBank = {};
  }

};

module.exports = CallbackRegistry;

},{}],"KJ8HU6":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ChangeEventPlugin
 */

"use strict";

var EventConstants = require("./EventConstants");
var EventPluginHub = require("./EventPluginHub");
var EventPropagators = require("./EventPropagators");
var ExecutionEnvironment = require("./ExecutionEnvironment");
var SyntheticEvent = require("./SyntheticEvent");

var isEventSupported = require("./isEventSupported");
var keyOf = require("./keyOf");

var topLevelTypes = EventConstants.topLevelTypes;

var eventTypes = {
  change: {
    phasedRegistrationNames: {
      bubbled: keyOf({onChange: null}),
      captured: keyOf({onChangeCapture: null})
    }
  }
};

/**
 * For IE shims
 */
var activeElement = null;
var activeElementID = null;
var activeElementValue = null;
var activeElementValueProp = null;


/**
 * SECTION: handle `change` event
 */
function shouldUseChangeEvent(elem) {
  return (
    elem.nodeName === 'SELECT' ||
    (elem.nodeName === 'INPUT' && elem.type === 'file')
  );
}

var doesChangeEventBubble = false;
if (ExecutionEnvironment.canUseDOM) {
  // See `handleChange` comment below
  doesChangeEventBubble = isEventSupported('change') && (
    !('documentMode' in document) || document.documentMode > 8
  );
}

function manualDispatchChangeEvent(nativeEvent) {
  var event = SyntheticEvent.getPooled(
    eventTypes.change,
    activeElementID,
    nativeEvent
  );
  EventPropagators.accumulateTwoPhaseDispatches(event);

  // If change bubbled, we'd just bind to it like all the other events
  // and have it go through ReactEventTopLevelCallback. Since it doesn't, we
  // manually listen for the change event and so we have to enqueue and
  // process the abstract event manually.
  EventPluginHub.enqueueEvents(event);
  EventPluginHub.processEventQueue();
}

function startWatchingForChangeEventIE8(target, targetID) {
  activeElement = target;
  activeElementID = targetID;
  activeElement.attachEvent('onchange', manualDispatchChangeEvent);
}

function stopWatchingForChangeEventIE8() {
  if (!activeElement) {
    return;
  }
  activeElement.detachEvent('onchange', manualDispatchChangeEvent);
  activeElement = null;
  activeElementID = null;
}

function getTargetIDForChangeEvent(
    topLevelType,
    topLevelTarget,
    topLevelTargetID) {
  if (topLevelType === topLevelTypes.topChange) {
    return topLevelTargetID;
  }
}
function handleEventsForChangeEventIE8(
    topLevelType,
    topLevelTarget,
    topLevelTargetID) {
  if (topLevelType === topLevelTypes.topFocus) {
    // stopWatching() should be a noop here but we call it just in case we
    // missed a blur event somehow.
    stopWatchingForChangeEventIE8();
    startWatchingForChangeEventIE8(topLevelTarget, topLevelTargetID);
  } else if (topLevelType === topLevelTypes.topBlur) {
    stopWatchingForChangeEventIE8();
  }
}


/**
 * SECTION: handle `input` event
 */
var isInputEventSupported = false;
if (ExecutionEnvironment.canUseDOM) {
  // IE9 claims to support the input event but fails to trigger it when
  // deleting text, so we ignore its input events
  isInputEventSupported = isEventSupported('input') && (
    !('documentMode' in document) || document.documentMode > 9
  );
}


/**
 * @see http://www.whatwg.org/specs/web-apps/current-work/multipage/the-input-element.html#input-type-attr-summary
 */
var supportedInputTypes = {
  'color': true,
  'date': true,
  'datetime': true,
  'datetime-local': true,
  'email': true,
  'month': true,
  'number': true,
  'password': true,
  'range': true,
  'search': true,
  'tel': true,
  'text': true,
  'time': true,
  'url': true,
  'week': true
};

function shouldUseInputEvent(elem) {
  return (
    (elem.nodeName === 'INPUT' && supportedInputTypes[elem.type]) ||
    elem.nodeName === 'TEXTAREA'
  );
}

/**
 * (For old IE.) Replacement getter/setter for the `value` property that gets
 * set on the active element.
 */
var newValueProp =  {
  get: function() {
    return activeElementValueProp.get.call(this);
  },
  set: function(val) {
    // Cast to a string so we can do equality checks.
    activeElementValue = '' + val;
    activeElementValueProp.set.call(this, val);
  }
};

/**
 * (For old IE.) Starts tracking propertychange events on the passed-in element
 * and override the value property so that we can distinguish user events from
 * value changes in JS.
 */
function startWatchingForValueChange(target, targetID) {
  activeElement = target;
  activeElementID = targetID;
  activeElementValue = target.value;
  activeElementValueProp = Object.getOwnPropertyDescriptor(
    target.constructor.prototype,
    'value'
  );

  Object.defineProperty(activeElement, 'value', newValueProp);
  activeElement.attachEvent('onpropertychange', handlePropertyChange);
}

/**
 * (For old IE.) Removes the event listeners from the currently-tracked element,
 * if any exists.
 */
function stopWatchingForValueChange() {
  if (!activeElement) {
    return;
  }

  // delete restores the original property definition
  delete activeElement.value;
  activeElement.detachEvent('onpropertychange', handlePropertyChange);

  activeElement = null;
  activeElementID = null;
  activeElementValue = null;
  activeElementValueProp = null;
}

/**
 * (For old IE.) Handles a propertychange event, sending a `change` event if
 * the value of the active element has changed.
 */
function handlePropertyChange(nativeEvent) {
  if (nativeEvent.propertyName !== 'value') {
    return;
  }
  var value = nativeEvent.srcElement.value;
  if (value === activeElementValue) {
    return;
  }
  activeElementValue = value;

  manualDispatchChangeEvent(nativeEvent);
}

/**
 * If a `change` event should be fired, returns the target's ID.
 */
function getTargetIDForInputEvent(
    topLevelType,
    topLevelTarget,
    topLevelTargetID) {
  if (topLevelType === topLevelTypes.topInput) {
    // In modern browsers (i.e., not IE8 or IE9), the input event is exactly
    // what we want so fall through here and trigger an abstract event
    return topLevelTargetID;
  }
}

// For IE8 and IE9.
function handleEventsForInputEventIE(
    topLevelType,
    topLevelTarget,
    topLevelTargetID) {
  if (topLevelType === topLevelTypes.topFocus) {
    // In IE8, we can capture almost all .value changes by adding a
    // propertychange handler and looking for events with propertyName
    // equal to 'value'
    // In IE9, propertychange fires for most input events but is buggy and
    // doesn't fire when text is deleted, but conveniently, selectionchange
    // appears to fire in all of the remaining cases so we catch those and
    // forward the event if the value has changed
    // In either case, we don't want to call the event handler if the value
    // is changed from JS so we redefine a setter for `.value` that updates
    // our activeElementValue variable, allowing us to ignore those changes
    //
    // stopWatching() should be a noop here but we call it just in case we
    // missed a blur event somehow.
    stopWatchingForValueChange();
    startWatchingForValueChange(topLevelTarget, topLevelTargetID);
  } else if (topLevelType === topLevelTypes.topBlur) {
    stopWatchingForValueChange();
  }
}

// For IE8 and IE9.
function getTargetIDForInputEventIE(
    topLevelType,
    topLevelTarget,
    topLevelTargetID) {
  if (topLevelType === topLevelTypes.topSelectionChange ||
      topLevelType === topLevelTypes.topKeyUp ||
      topLevelType === topLevelTypes.topKeyDown) {
    // On the selectionchange event, the target is just document which isn't
    // helpful for us so just check activeElement instead.
    //
    // 99% of the time, keydown and keyup aren't necessary. IE8 fails to fire
    // propertychange on the first input event after setting `value` from a
    // script and fires only keydown, keypress, keyup. Catching keyup usually
    // gets it and catching keydown lets us fire an event for the first
    // keystroke if user does a key repeat (it'll be a little delayed: right
    // before the second keystroke). Other input methods (e.g., paste) seem to
    // fire selectionchange normally.
    if (activeElement && activeElement.value !== activeElementValue) {
      activeElementValue = activeElement.value;
      return activeElementID;
    }
  }
}


/**
 * SECTION: handle `click` event
 */
function shouldUseClickEvent(elem) {
  // Use the `click` event to detect changes to checkbox and radio inputs.
  // This approach works across all browsers, whereas `change` does not fire
  // until `blur` in IE8.
  return (
    elem.nodeName === 'INPUT' &&
    (elem.type === 'checkbox' || elem.type === 'radio')
  );
}

function getTargetIDForClickEvent(
    topLevelType,
    topLevelTarget,
    topLevelTargetID) {
  if (topLevelType === topLevelTypes.topClick) {
    return topLevelTargetID;
  }
}

/**
 * This plugin creates an `onChange` event that normalizes change events
 * across form elements. This event fires at a time when it's possible to
 * change the element's value without seeing a flicker.
 *
 * Supported elements are:
 * - input (see `supportedInputTypes`)
 * - textarea
 * - select
 */
var ChangeEventPlugin = {

  eventTypes: eventTypes,

  /**
   * @param {string} topLevelType Record from `EventConstants`.
   * @param {DOMEventTarget} topLevelTarget The listening component root node.
   * @param {string} topLevelTargetID ID of `topLevelTarget`.
   * @param {object} nativeEvent Native browser event.
   * @return {*} An accumulation of synthetic events.
   * @see {EventPluginHub.extractEvents}
   */
  extractEvents: function(
      topLevelType,
      topLevelTarget,
      topLevelTargetID,
      nativeEvent) {

    var getTargetIDFunc, handleEventFunc;
    if (shouldUseChangeEvent(topLevelTarget)) {
      if (doesChangeEventBubble) {
        getTargetIDFunc = getTargetIDForChangeEvent;
      } else {
        handleEventFunc = handleEventsForChangeEventIE8;
      }
    } else if (shouldUseInputEvent(topLevelTarget)) {
      if (isInputEventSupported) {
        getTargetIDFunc = getTargetIDForInputEvent;
      } else {
        getTargetIDFunc = getTargetIDForInputEventIE;
        handleEventFunc = handleEventsForInputEventIE;
      }
    } else if (shouldUseClickEvent(topLevelTarget)) {
      getTargetIDFunc = getTargetIDForClickEvent;
    }

    if (getTargetIDFunc) {
      var targetID = getTargetIDFunc(
        topLevelType,
        topLevelTarget,
        topLevelTargetID
      );
      if (targetID) {
        var event = SyntheticEvent.getPooled(
          eventTypes.change,
          targetID,
          nativeEvent
        );
        EventPropagators.accumulateTwoPhaseDispatches(event);
        return event;
      }
    }

    if (handleEventFunc) {
      handleEventFunc(
        topLevelType,
        topLevelTarget,
        topLevelTargetID
      );
    }
  }

};

module.exports = ChangeEventPlugin;

},{"./EventConstants":"Gaqr6V","./EventPluginHub":"EddLdT","./EventPropagators":"n/zMdI","./ExecutionEnvironment":"mrmvk9","./SyntheticEvent":"L5ht1h","./isEventSupported":"Iv78kc","./keyOf":"Q4rOoG"}],"a0oMnh":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule DOMChildrenOperations
 * @typechecks static-only
 */

"use strict";

var Danger = require("./Danger");
var ReactMultiChildUpdateTypes = require("./ReactMultiChildUpdateTypes");

var getTextContentAccessor = require("./getTextContentAccessor");

/**
 * The DOM property to use when setting text content.
 *
 * @type {string}
 * @private
 */
var textContentAccessor = getTextContentAccessor() || 'NA';

/**
 * Inserts `childNode` as a child of `parentNode` at the `index`.
 *
 * @param {DOMElement} parentNode Parent node in which to insert.
 * @param {DOMElement} childNode Child node to insert.
 * @param {number} index Index at which to insert the child.
 * @internal
 */
function insertChildAt(parentNode, childNode, index) {
  var childNodes = parentNode.childNodes;
  if (childNodes[index] === childNode) {
    return;
  }
  // If `childNode` is already a child of `parentNode`, remove it so that
  // computing `childNodes[index]` takes into account the removal.
  if (childNode.parentNode === parentNode) {
    parentNode.removeChild(childNode);
  }
  if (index >= childNodes.length) {
    parentNode.appendChild(childNode);
  } else {
    parentNode.insertBefore(childNode, childNodes[index]);
  }
}

/**
 * Operations for updating with DOM children.
 */
var DOMChildrenOperations = {

  dangerouslyReplaceNodeWithMarkup: Danger.dangerouslyReplaceNodeWithMarkup,

  /**
   * Updates a component's children by processing a series of updates. The
   * update configurations are each expected to have a `parentNode` property.
   *
   * @param {array<object>} updates List of update configurations.
   * @param {array<string>} markupList List of markup strings.
   * @internal
   */
  processUpdates: function(updates, markupList) {
    var update;
    // Mapping from parent IDs to initial child orderings.
    var initialChildren = null;
    // List of children that will be moved or removed.
    var updatedChildren = null;

    for (var i = 0; update = updates[i]; i++) {
      if (update.type === ReactMultiChildUpdateTypes.MOVE_EXISTING ||
          update.type === ReactMultiChildUpdateTypes.REMOVE_NODE) {
        var updatedIndex = update.fromIndex;
        var updatedChild = update.parentNode.childNodes[updatedIndex];
        var parentID = update.parentID;

        initialChildren = initialChildren || {};
        initialChildren[parentID] = initialChildren[parentID] || [];
        initialChildren[parentID][updatedIndex] = updatedChild;

        updatedChildren = updatedChildren || [];
        updatedChildren.push(updatedChild);
      }
    }

    var renderedMarkup = Danger.dangerouslyRenderMarkup(markupList);

    // Remove updated children first so that `toIndex` is consistent.
    if (updatedChildren) {
      for (var j = 0; j < updatedChildren.length; j++) {
        updatedChildren[j].parentNode.removeChild(updatedChildren[j]);
      }
    }

    for (var k = 0; update = updates[k]; k++) {
      switch (update.type) {
        case ReactMultiChildUpdateTypes.INSERT_MARKUP:
          insertChildAt(
            update.parentNode,
            renderedMarkup[update.markupIndex],
            update.toIndex
          );
          break;
        case ReactMultiChildUpdateTypes.MOVE_EXISTING:
          insertChildAt(
            update.parentNode,
            initialChildren[update.parentID][update.fromIndex],
            update.toIndex
          );
          break;
        case ReactMultiChildUpdateTypes.TEXT_CONTENT:
          update.parentNode[textContentAccessor] = update.textContent;
          break;
        case ReactMultiChildUpdateTypes.REMOVE_NODE:
          // Already removed by the for-loop above.
          break;
      }
    }
  }

};

module.exports = DOMChildrenOperations;

},{"./Danger":"M4LxPz","./ReactMultiChildUpdateTypes":"1fqbih","./getTextContentAccessor":"Suh93r"}],"fduHX3":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule DOMProperty
 * @typechecks static-only
 */

/*jslint bitwise: true */

"use strict";

var invariant = require("./invariant");

var DOMPropertyInjection = {
  /**
   * Mapping from normalized, camelcased property names to a configuration that
   * specifies how the associated DOM property should be accessed or rendered.
   */
  MUST_USE_ATTRIBUTE: 0x1,
  MUST_USE_PROPERTY:  0x2,
  HAS_BOOLEAN_VALUE:  0x4,
  HAS_SIDE_EFFECTS:   0x8,

  /**
   * Inject some specialized knowledge about the DOM. This takes a config object
   * with the following properties:
   *
   * isCustomAttribute: function that given an attribute name will return true
   * if it can be inserted into the DOM verbatim. Useful for data-* or aria-*
   * attributes where it's impossible to enumerate all of the possible
   * attribute names,
   *
   * Properties: object mapping DOM property name to one of the
   * DOMPropertyInjection constants or null. If your attribute isn't in here,
   * it won't get written to the DOM.
   *
   * DOMAttributeNames: object mapping React attribute name to the DOM
   * attribute name. Attribute names not specified use the **lowercase**
   * normalized name.
   *
   * DOMPropertyNames: similar to DOMAttributeNames but for DOM properties.
   * Property names not specified use the normalized name.
   *
   * DOMMutationMethods: Properties that require special mutation methods. If
   * `value` is undefined, the mutation method should unset the property.
   *
   * @param {object} domPropertyConfig the config as described above.
   */
  injectDOMPropertyConfig: function(domPropertyConfig) {
    var Properties = domPropertyConfig.Properties || {};
    var DOMAttributeNames = domPropertyConfig.DOMAttributeNames || {};
    var DOMPropertyNames = domPropertyConfig.DOMPropertyNames || {};
    var DOMMutationMethods = domPropertyConfig.DOMMutationMethods || {};

    if (domPropertyConfig.isCustomAttribute) {
      DOMProperty._isCustomAttributeFunctions.push(
        domPropertyConfig.isCustomAttribute
      );
    }

    for (var propName in Properties) {
      invariant(!DOMProperty.isStandardName[propName]);

      DOMProperty.isStandardName[propName] = true;

      DOMProperty.getAttributeName[propName] =
        DOMAttributeNames[propName] || propName.toLowerCase();

      DOMProperty.getPropertyName[propName] =
        DOMPropertyNames[propName] || propName;

      var mutationMethod = DOMMutationMethods[propName];
      if (mutationMethod) {
        DOMProperty.getMutationMethod[propName] = mutationMethod;
      }

      var propConfig = Properties[propName];
      DOMProperty.mustUseAttribute[propName] =
        propConfig & DOMPropertyInjection.MUST_USE_ATTRIBUTE;
      DOMProperty.mustUseProperty[propName] =
        propConfig & DOMPropertyInjection.MUST_USE_PROPERTY;
      DOMProperty.hasBooleanValue[propName] =
        propConfig & DOMPropertyInjection.HAS_BOOLEAN_VALUE;
      DOMProperty.hasSideEffects[propName] =
        propConfig & DOMPropertyInjection.HAS_SIDE_EFFECTS;

      invariant(!DOMProperty.mustUseAttribute[propName] ||
        !DOMProperty.mustUseProperty[propName]);
      invariant(DOMProperty.mustUseProperty[propName] ||
        !DOMProperty.hasSideEffects[propName]);
    }
  }
};
var defaultValueCache = {};

/**
 * DOMProperty exports lookup objects that can be used like functions:
 *
 *   > DOMProperty.isValid['id']
 *   true
 *   > DOMProperty.isValid['foobar']
 *   undefined
 *
 * Although this may be confusing, it performs better in general.
 *
 * @see http://jsperf.com/key-exists
 * @see http://jsperf.com/key-missing
 */
var DOMProperty = {

  /**
   * Checks whether a property name is a standard property.
   * @type {Object}
   */
  isStandardName: {},

  /**
   * Mapping from normalized names to attribute names that differ. Attribute
   * names are used when rendering markup or with `*Attribute()`.
   * @type {Object}
   */
  getAttributeName: {},

  /**
   * Mapping from normalized names to properties on DOM node instances.
   * (This includes properties that mutate due to external factors.)
   * @type {Object}
   */
  getPropertyName: {},

  /**
   * Mapping from normalized names to mutation methods. This will only exist if
   * mutation cannot be set simply by the property or `setAttribute()`.
   * @type {Object}
   */
  getMutationMethod: {},

  /**
   * Whether the property must be accessed and mutated as an object property.
   * @type {Object}
   */
  mustUseAttribute: {},

  /**
   * Whether the property must be accessed and mutated using `*Attribute()`.
   * (This includes anything that fails `<propName> in <element>`.)
   * @type {Object}
   */
  mustUseProperty: {},

  /**
   * Whether the property should be removed when set to a falsey value.
   * @type {Object}
   */
  hasBooleanValue: {},

  /**
   * Whether or not setting a value causes side effects such as triggering
   * resources to be loaded or text selection changes. We must ensure that
   * the value is only set if it has changed.
   * @type {Object}
   */
  hasSideEffects: {},

  /**
   * All of the isCustomAttribute() functions that have been injected.
   */
  _isCustomAttributeFunctions: [],

  /**
   * Checks whether a property name is a custom attribute.
   * @method
   */
  isCustomAttribute: function(attributeName) {
    return DOMProperty._isCustomAttributeFunctions.some(
      function(isCustomAttributeFn) {
        return isCustomAttributeFn.call(null, attributeName);
      }
    );
  },

  /**
   * Returns the default property value for a DOM property (i.e., not an
   * attribute). Most default values are '' or false, but not all. Worse yet,
   * some (in particular, `type`) vary depending on the type of element.
   *
   * TODO: Is it better to grab all the possible properties when creating an
   * element to avoid having to create the same element twice?
   */
  getDefaultValueForProperty: function(nodeName, prop) {
    var nodeDefaults = defaultValueCache[nodeName];
    var testElement;
    if (!nodeDefaults) {
      defaultValueCache[nodeName] = nodeDefaults = {};
    }
    if (!(prop in nodeDefaults)) {
      testElement = document.createElement(nodeName);
      nodeDefaults[prop] = testElement[prop];
    }
    return nodeDefaults[prop];
  },

  injection: DOMPropertyInjection
};

module.exports = DOMProperty;

},{"./invariant":"hPxNWC"}],"n+MrOf":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule DOMPropertyOperations
 * @typechecks static-only
 */

"use strict";

var DOMProperty = require("./DOMProperty");

var escapeTextForBrowser = require("./escapeTextForBrowser");
var memoizeStringOnly = require("./memoizeStringOnly");

var processAttributeNameAndPrefix = memoizeStringOnly(function(name) {
  return escapeTextForBrowser(name) + '="';
});

/**
 * Operations for dealing with DOM properties.
 */
var DOMPropertyOperations = {

  /**
   * Creates markup for a property.
   *
   * @param {string} name
   * @param {*} value
   * @return {?string} Markup string, or null if the property was invalid.
   */
  createMarkupForProperty: function(name, value) {
    if (DOMProperty.isStandardName[name]) {
      if (value == null || DOMProperty.hasBooleanValue[name] && !value) {
        return '';
      }
      var attributeName = DOMProperty.getAttributeName[name];
      return processAttributeNameAndPrefix(attributeName) +
        escapeTextForBrowser(value) + '"';
    } else if (DOMProperty.isCustomAttribute(name)) {
      if (value == null) {
        return '';
      }
      return processAttributeNameAndPrefix(name) +
        escapeTextForBrowser(value) + '"';
    } else {
      return null;
    }
  },

  /**
   * Sets the value for a property on a node.
   *
   * @param {DOMElement} node
   * @param {string} name
   * @param {*} value
   */
  setValueForProperty: function(node, name, value) {
    if (DOMProperty.isStandardName[name]) {
      var mutationMethod = DOMProperty.getMutationMethod[name];
      if (mutationMethod) {
        mutationMethod(node, value);
      } else if (DOMProperty.mustUseAttribute[name]) {
        if (DOMProperty.hasBooleanValue[name] && !value) {
          node.removeAttribute(DOMProperty.getAttributeName[name]);
        } else {
          node.setAttribute(DOMProperty.getAttributeName[name], value);
        }
      } else {
        var propName = DOMProperty.getPropertyName[name];
        if (!DOMProperty.hasSideEffects[name] || node[propName] !== value) {
          node[propName] = value;
        }
      }
    } else if (DOMProperty.isCustomAttribute(name)) {
      node.setAttribute(name, value);
    }
  },

  /**
   * Deletes the value for a property on a node.
   *
   * @param {DOMElement} node
   * @param {string} name
   */
  deleteValueForProperty: function(node, name) {
    if (DOMProperty.isStandardName[name]) {
      var mutationMethod = DOMProperty.getMutationMethod[name];
      if (mutationMethod) {
        mutationMethod(node, undefined);
      } else if (DOMProperty.mustUseAttribute[name]) {
        node.removeAttribute(DOMProperty.getAttributeName[name]);
      } else {
        var propName = DOMProperty.getPropertyName[name];
        node[propName] = DOMProperty.getDefaultValueForProperty(
          node.nodeName,
          name
        );
      }
    } else if (DOMProperty.isCustomAttribute(name)) {
      node.removeAttribute(name);
    }
  }

};

module.exports = DOMPropertyOperations;

},{"./DOMProperty":"fduHX3","./escapeTextForBrowser":"ZaIegL","./memoizeStringOnly":"w+d2Nh"}],"M4LxPz":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule Danger
 * @typechecks static-only
 */

/*jslint evil: true, sub: true */

"use strict";

var ExecutionEnvironment = require("./ExecutionEnvironment");

var createNodesFromMarkup = require("./createNodesFromMarkup");
var emptyFunction = require("./emptyFunction");
var getMarkupWrap = require("./getMarkupWrap");
var invariant = require("./invariant");

/**
 * Extracts the `nodeName` from a string of markup.
 *
 * NOTE: Extracting the `nodeName` does not require a regular expression match
 * because we make assumptions about React-generated markup (i.e. there are no
 * spaces surrounding the opening tag and there is at least one attribute).
 *
 * @param {string} markup String of markup.
 * @return {string} Node name of the supplied markup.
 * @see http://jsperf.com/extract-nodename
 */
function getNodeName(markup) {
  return markup.substring(1, markup.indexOf(' '));
}

var Danger = {

  /**
   * Renders markup into an array of nodes. The markup is expected to render
   * into a list of root nodes. Also, the length of `parentNodes` and `markup`
   * should be the same.
   *
   * @param {array<string>} markupList List of markup strings to render.
   * @return {array<DOMElement>} List of rendered nodes.
   * @internal
   */
  dangerouslyRenderMarkup: function(markupList) {
    invariant(ExecutionEnvironment.canUseDOM);
    var nodeName;
    var markupByNodeName = {};
    // Group markup by `nodeName` if a wrap is necessary, else by '*'.
    for (var i = 0; i < markupList.length; i++) {
      invariant(markupList[i]);
      nodeName = getNodeName(markupList[i]);
      nodeName = getMarkupWrap(nodeName) ? nodeName : '*';
      markupByNodeName[nodeName] = markupByNodeName[nodeName] || [];
      markupByNodeName[nodeName][i] = markupList[i];
    }
    var resultList = [];
    for (nodeName in markupByNodeName) {
      if (!markupByNodeName.hasOwnProperty(nodeName)) {
        continue;
      }
      var markupListByNodeName = markupByNodeName[nodeName];
      var markup = markupListByNodeName.join('');
      // Render each group of markup with similar `nodeName`.
      var renderNodes = createNodesFromMarkup(markup, emptyFunction);
      // Restore the initial ordering.
      var renderIndex = 0;
      var resultIndex = 0;
      while (resultIndex < markupListByNodeName.length) {
        // `markupListByNodeName` may be a sparse array.
        if (markupListByNodeName[resultIndex]) {
          invariant(resultList[resultIndex] = renderNodes[renderIndex]);
          renderIndex++;
        }
        resultIndex++;
      }
      invariant(renderIndex === renderNodes.length);
    }
    return resultList;
  },

  /**
   * Replaces a node with a string of markup at its current position within its
   * parent. The markup must render into a single root node.
   *
   * @param {DOMElement} oldChild Child node to replace.
   * @param {string} markup Markup to render in place of the child node.
   * @internal
   */
  dangerouslyReplaceNodeWithMarkup: function(oldChild, markup) {
    invariant(ExecutionEnvironment.canUseDOM);
    invariant(markup);
    var newChild = createNodesFromMarkup(markup, emptyFunction)[0];
    oldChild.parentNode.replaceChild(newChild, oldChild);
  }

};

module.exports = Danger;

},{"./ExecutionEnvironment":"mrmvk9","./createNodesFromMarkup":"iqoonm","./emptyFunction":"RxjlFd","./getMarkupWrap":"a26iu1","./invariant":"hPxNWC"}],"lojxFf":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule DefaultDOMPropertyConfig
 */

"use strict";

var DOMProperty = require("./DOMProperty");

var MUST_USE_ATTRIBUTE = DOMProperty.injection.MUST_USE_ATTRIBUTE;
var MUST_USE_PROPERTY = DOMProperty.injection.MUST_USE_PROPERTY;
var HAS_BOOLEAN_VALUE = DOMProperty.injection.HAS_BOOLEAN_VALUE;
var HAS_SIDE_EFFECTS = DOMProperty.injection.HAS_SIDE_EFFECTS;

var DefaultDOMPropertyConfig = {
  isCustomAttribute: RegExp.prototype.test.bind(
    /^(data|aria)-[a-z_][a-z\d_.\-]*$/
  ),
  Properties: {
    /**
     * Standard Properties
     */
    accessKey: null,
    accept: null,
    action: null,
    ajaxify: MUST_USE_ATTRIBUTE,
    allowFullScreen: MUST_USE_ATTRIBUTE | HAS_BOOLEAN_VALUE,
    allowTransparency: MUST_USE_ATTRIBUTE,
    alt: null,
    autoComplete: null,
    autoFocus: HAS_BOOLEAN_VALUE,
    autoPlay: HAS_BOOLEAN_VALUE,
    cellPadding: null,
    cellSpacing: null,
    charSet: MUST_USE_ATTRIBUTE,
    checked: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
    className: MUST_USE_PROPERTY,
    colSpan: null,
    content: null,
    contentEditable: null,
    contextMenu: MUST_USE_ATTRIBUTE,
    controls: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
    data: null, // For `<object />` acts as `src`.
    dateTime: MUST_USE_ATTRIBUTE,
    dir: null,
    disabled: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
    draggable: null,
    encType: null,
    frameBorder: MUST_USE_ATTRIBUTE,
    height: MUST_USE_ATTRIBUTE,
    hidden: MUST_USE_ATTRIBUTE | HAS_BOOLEAN_VALUE,
    href: null,
    htmlFor: null,
    httpEquiv: null,
    icon: null,
    id: MUST_USE_PROPERTY,
    label: null,
    lang: null,
    list: null,
    max: null,
    maxLength: MUST_USE_ATTRIBUTE,
    method: null,
    min: null,
    multiple: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
    name: null,
    pattern: null,
    poster: null,
    preload: null,
    placeholder: null,
    radioGroup: null,
    rel: null,
    readOnly: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
    required: HAS_BOOLEAN_VALUE,
    role: MUST_USE_ATTRIBUTE,
    rowSpan: null,
    scrollLeft: MUST_USE_PROPERTY,
    scrollTop: MUST_USE_PROPERTY,
    selected: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
    size: null,
    spellCheck: null,
    src: null,
    step: null,
    style: null,
    tabIndex: null,
    target: null,
    title: null,
    type: null,
    value: MUST_USE_PROPERTY | HAS_SIDE_EFFECTS,
    width: MUST_USE_ATTRIBUTE,
    wmode: MUST_USE_ATTRIBUTE,

    /**
     * Non-standard Properties
     */
    autoCapitalize: null, // Supported in Mobile Safari for keyboard hints

    /**
     * SVG Properties
     */
    cx: MUST_USE_PROPERTY,
    cy: MUST_USE_PROPERTY,
    d: MUST_USE_PROPERTY,
    fill: MUST_USE_PROPERTY,
    fx: MUST_USE_PROPERTY,
    fy: MUST_USE_PROPERTY,
    points: MUST_USE_PROPERTY,
    r: MUST_USE_PROPERTY,
    stroke: MUST_USE_PROPERTY,
    strokeLinecap: MUST_USE_PROPERTY,
    strokeWidth: MUST_USE_PROPERTY,
    transform: MUST_USE_PROPERTY,
    x: MUST_USE_PROPERTY,
    x1: MUST_USE_PROPERTY,
    x2: MUST_USE_PROPERTY,
    version: MUST_USE_PROPERTY,
    viewBox: MUST_USE_PROPERTY,
    y: MUST_USE_PROPERTY,
    y1: MUST_USE_PROPERTY,
    y2: MUST_USE_PROPERTY,
    spreadMethod: MUST_USE_PROPERTY,
    offset: MUST_USE_PROPERTY,
    stopColor: MUST_USE_PROPERTY,
    stopOpacity: MUST_USE_PROPERTY,
    gradientUnits: MUST_USE_PROPERTY,
    gradientTransform: MUST_USE_PROPERTY
  },
  DOMAttributeNames: {
    className: 'class',
    htmlFor: 'for',
    strokeLinecap: 'stroke-linecap',
    strokeWidth: 'stroke-width',
    stopColor: 'stop-color',
    stopOpacity: 'stop-opacity'
  },
  DOMPropertyNames: {
    autoCapitalize: 'autocapitalize',
    autoComplete: 'autocomplete',
    autoFocus: 'autofocus',
    autoPlay: 'autoplay',
    encType: 'enctype',
    radioGroup: 'radiogroup',
    spellCheck: 'spellcheck'
  },
  DOMMutationMethods: {
    /**
     * Setting `className` to null may cause it to be set to the string "null".
     *
     * @param {DOMElement} node
     * @param {*} value
     */
    className: function(node, value) {
      node.className = value || '';
    }
  }
};

module.exports = DefaultDOMPropertyConfig;

},{"./DOMProperty":"fduHX3"}],"rrDzGt":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule DefaultEventPluginOrder
 */

"use strict";

 var keyOf = require("./keyOf");

/**
 * Module that is injectable into `EventPluginHub`, that specifies a
 * deterministic ordering of `EventPlugin`s. A convenient way to reason about
 * plugins, without having to package every one of them. This is better than
 * having plugins be ordered in the same order that they are injected because
 * that ordering would be influenced by the packaging order.
 * `ResponderEventPlugin` must occur before `SimpleEventPlugin` so that
 * preventing default on events is convenient in `SimpleEventPlugin` handlers.
 */
var DefaultEventPluginOrder = [
  keyOf({ResponderEventPlugin: null}),
  keyOf({SimpleEventPlugin: null}),
  keyOf({TapEventPlugin: null}),
  keyOf({EnterLeaveEventPlugin: null}),
  keyOf({ChangeEventPlugin: null}),
  keyOf({AnalyticsEventPlugin: null}),
  keyOf({MobileSafariClickEventPlugin: null})
];

module.exports = DefaultEventPluginOrder;

},{"./keyOf":"Q4rOoG"}],"NAAuN8":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule EnterLeaveEventPlugin
 * @typechecks static-only
 */

"use strict";

var EventConstants = require("./EventConstants");
var EventPropagators = require("./EventPropagators");
var ExecutionEnvironment = require("./ExecutionEnvironment");
var SyntheticMouseEvent = require("./SyntheticMouseEvent");

var ReactMount = require("./ReactMount");
var keyOf = require("./keyOf");

var topLevelTypes = EventConstants.topLevelTypes;
var getFirstReactDOM = ReactMount.getFirstReactDOM;

var eventTypes = {
  mouseEnter: {registrationName: keyOf({onMouseEnter: null})},
  mouseLeave: {registrationName: keyOf({onMouseLeave: null})}
};

var EnterLeaveEventPlugin = {

  eventTypes: eventTypes,

  /**
   * For almost every interaction we care about, there will be both a top-level
   * `mouseover` and `mouseout` event that occurs. Only use `mouseout` so that
   * we do not extract duplicate events. However, moving the mouse into the
   * browser from outside will not fire a `mouseout` event. In this case, we use
   * the `mouseover` top-level event.
   *
   * @param {string} topLevelType Record from `EventConstants`.
   * @param {DOMEventTarget} topLevelTarget The listening component root node.
   * @param {string} topLevelTargetID ID of `topLevelTarget`.
   * @param {object} nativeEvent Native browser event.
   * @return {*} An accumulation of synthetic events.
   * @see {EventPluginHub.extractEvents}
   */
  extractEvents: function(
      topLevelType,
      topLevelTarget,
      topLevelTargetID,
      nativeEvent) {
    if (topLevelType === topLevelTypes.topMouseOver &&
        (nativeEvent.relatedTarget || nativeEvent.fromElement)) {
      return null;
    }
    if (topLevelType !== topLevelTypes.topMouseOut &&
        topLevelType !== topLevelTypes.topMouseOver) {
      // Must not be a mouse in or mouse out - ignoring.
      return null;
    }

    var from, to;
    if (topLevelType === topLevelTypes.topMouseOut) {
      from = topLevelTarget;
      to =
        getFirstReactDOM(nativeEvent.relatedTarget || nativeEvent.toElement) ||
        ExecutionEnvironment.global;
    } else {
      from = ExecutionEnvironment.global;
      to = topLevelTarget;
    }

    if (from === to) {
      // Nothing pertains to our managed components.
      return null;
    }

    var fromID = from ? ReactMount.getID(from) : '';
    var toID = to ? ReactMount.getID(to) : '';

    var leave = SyntheticMouseEvent.getPooled(
      eventTypes.mouseLeave,
      fromID,
      nativeEvent
    );
    var enter = SyntheticMouseEvent.getPooled(
      eventTypes.mouseEnter,
      toID,
      nativeEvent
    );

    EventPropagators.accumulateEnterLeaveDispatches(leave, enter, fromID, toID);
    return [leave, enter];
  }

};

module.exports = EnterLeaveEventPlugin;

},{"./EventConstants":"Gaqr6V","./EventPropagators":"n/zMdI","./ExecutionEnvironment":"mrmvk9","./ReactMount":"1R+7Eu","./SyntheticMouseEvent":"v7zPvJ","./keyOf":"Q4rOoG"}],"Gaqr6V":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule EventConstants
 */

"use strict";

var keyMirror = require("./keyMirror");

var PropagationPhases = keyMirror({bubbled: null, captured: null});

/**
 * Types of raw signals from the browser caught at the top level.
 */
var topLevelTypes = keyMirror({
  topBlur: null,
  topChange: null,
  topClick: null,
  topDOMCharacterDataModified: null,
  topDoubleClick: null,
  topDrag: null,
  topDragEnd: null,
  topDragEnter: null,
  topDragExit: null,
  topDragLeave: null,
  topDragOver: null,
  topDragStart: null,
  topDrop: null,
  topFocus: null,
  topInput: null,
  topKeyDown: null,
  topKeyPress: null,
  topKeyUp: null,
  topMouseDown: null,
  topMouseMove: null,
  topMouseOut: null,
  topMouseOver: null,
  topMouseUp: null,
  topScroll: null,
  topSelectionChange: null,
  topSubmit: null,
  topTouchCancel: null,
  topTouchEnd: null,
  topTouchMove: null,
  topTouchStart: null,
  topWheel: null
});

var EventConstants = {
  topLevelTypes: topLevelTypes,
  PropagationPhases: PropagationPhases
};

module.exports = EventConstants;

},{"./keyMirror":"n1FgJb"}],"e0NKSL":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule EventListener
 */

/**
 * Upstream version of event listener. Does not take into account specific
 * nature of platform.
 */
var EventListener = {
  /**
   * Listens to bubbled events on a DOM node.
   *
   * @param {Element} el DOM element to register listener on.
   * @param {string} handlerBaseName 'click'/'mouseover'
   * @param {Function!} cb Callback function
   */
  listen: function(el, handlerBaseName, cb) {
    if (el.addEventListener) {
      el.addEventListener(handlerBaseName, cb, false);
    } else if (el.attachEvent) {
      el.attachEvent('on' + handlerBaseName, cb);
    }
  },

  /**
   * Listens to captured events on a DOM node.
   *
   * @see `EventListener.listen` for params.
   * @throws Exception if addEventListener is not supported.
   */
  capture: function(el, handlerBaseName, cb) {
    if (!el.addEventListener) {
        return;
    } else {
      el.addEventListener(handlerBaseName, cb, true);
    }
  }
};

module.exports = EventListener;

},{}],"EddLdT":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule EventPluginHub
 */

"use strict";

var CallbackRegistry = require("./CallbackRegistry");
var EventPluginRegistry = require("./EventPluginRegistry");
var EventPluginUtils = require("./EventPluginUtils");
var EventPropagators = require("./EventPropagators");
var ExecutionEnvironment = require("./ExecutionEnvironment");

var accumulate = require("./accumulate");
var forEachAccumulated = require("./forEachAccumulated");
var invariant = require("./invariant");

/**
 * Internal queue of events that have accumulated their dispatches and are
 * waiting to have their dispatches executed.
 */
var eventQueue = null;

/**
 * Dispatches an event and releases it back into the pool, unless persistent.
 *
 * @param {?object} event Synthetic event to be dispatched.
 * @private
 */
var executeDispatchesAndRelease = function(event) {
  if (event) {
    var executeDispatch = EventPluginUtils.executeDispatch;
    // Plugins can provide custom behavior when dispatching events.
    var PluginModule = EventPluginRegistry.getPluginModuleForEvent(event);
    if (PluginModule && PluginModule.executeDispatch) {
      executeDispatch = PluginModule.executeDispatch;
    }
    EventPluginUtils.executeDispatchesInOrder(event, executeDispatch);

    if (!event.isPersistent()) {
      event.constructor.release(event);
    }
  }
};

/**
 * This is a unified interface for event plugins to be installed and configured.
 *
 * Event plugins can implement the following properties:
 *
 *   `extractEvents` {function(string, DOMEventTarget, string, object): *}
 *     Required. When a top-level event is fired, this method is expected to
 *     extract synthetic events that will in turn be queued and dispatched.
 *
 *   `eventTypes` {object}
 *     Optional, plugins that fire events must publish a mapping of registration
 *     names that are used to register listeners. Values of this mapping must
 *     be objects that contain `registrationName` or `phasedRegistrationNames`.
 *
 *   `executeDispatch` {function(object, function, string)}
 *     Optional, allows plugins to override how an event gets dispatched. By
 *     default, the listener is simply invoked.
 *
 * Each plugin that is injected into `EventsPluginHub` is immediately operable.
 *
 * @public
 */
var EventPluginHub = {

  /**
   * Methods for injecting dependencies.
   */
  injection: {

    /**
     * @param {object} InjectedInstanceHandle
     * @public
     */
    injectInstanceHandle: EventPropagators.injection.injectInstanceHandle,

    /**
     * @param {array} InjectedEventPluginOrder
     * @public
     */
    injectEventPluginOrder: EventPluginRegistry.injectEventPluginOrder,

    /**
     * @param {object} injectedNamesToPlugins Map from names to plugin modules.
     */
    injectEventPluginsByName: EventPluginRegistry.injectEventPluginsByName

  },

  registrationNames: EventPluginRegistry.registrationNames,

  putListener: CallbackRegistry.putListener,

  getListener: CallbackRegistry.getListener,

  deleteListener: CallbackRegistry.deleteListener,

  deleteAllListeners: CallbackRegistry.deleteAllListeners,

  /**
   * Allows registered plugins an opportunity to extract events from top-level
   * native browser events.
   *
   * @param {string} topLevelType Record from `EventConstants`.
   * @param {DOMEventTarget} topLevelTarget The listening component root node.
   * @param {string} topLevelTargetID ID of `topLevelTarget`.
   * @param {object} nativeEvent Native browser event.
   * @return {*} An accumulation of synthetic events.
   * @internal
   */
  extractEvents: function(
      topLevelType,
      topLevelTarget,
      topLevelTargetID,
      nativeEvent) {
    var events;
    var plugins = EventPluginRegistry.plugins;
    for (var i = 0, l = plugins.length; i < l; i++) {
      // Not every plugin in the ordering may be loaded at runtime.
      var possiblePlugin = plugins[i];
      if (possiblePlugin) {
        var extractedEvents = possiblePlugin.extractEvents(
          topLevelType,
          topLevelTarget,
          topLevelTargetID,
          nativeEvent
        );
        if (extractedEvents) {
          events = accumulate(events, extractedEvents);
        }
      }
    }
    return events;
  },

  /**
   * Enqueues a synthetic event that should be dispatched when
   * `processEventQueue` is invoked.
   *
   * @param {*} events An accumulation of synthetic events.
   * @internal
   */
  enqueueEvents: function(events) {
    if (events) {
      eventQueue = accumulate(eventQueue, events);
    }
  },

  /**
   * Dispatches all synthetic events on the event queue.
   *
   * @internal
   */
  processEventQueue: function() {
    // Set `eventQueue` to null before processing it so that we can tell if more
    // events get enqueued while processing.
    var processingEventQueue = eventQueue;
    eventQueue = null;
    forEachAccumulated(processingEventQueue, executeDispatchesAndRelease);
    invariant(!eventQueue);
  }

};

if (ExecutionEnvironment.canUseDOM) {
  window.EventPluginHub = EventPluginHub;
}

module.exports = EventPluginHub;

},{"./CallbackRegistry":"L1h3na","./EventPluginRegistry":"bKyk3V","./EventPluginUtils":"K4QB+L","./EventPropagators":"n/zMdI","./ExecutionEnvironment":"mrmvk9","./accumulate":"rpm6kU","./forEachAccumulated":"pcy7SL","./invariant":"hPxNWC"}],"bKyk3V":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule EventPluginRegistry
 * @typechecks static-only
 */

"use strict";

var invariant = require("./invariant");

/**
 * Injectable ordering of event plugins.
 */
var EventPluginOrder = null;

/**
 * Injectable mapping from names to event plugin modules.
 */
var namesToPlugins = {};

/**
 * Recomputes the plugin list using the injected plugins and plugin ordering.
 *
 * @private
 */
function recomputePluginOrdering() {
  if (!EventPluginOrder) {
    // Wait until an `EventPluginOrder` is injected.
    return;
  }
  for (var pluginName in namesToPlugins) {
    var PluginModule = namesToPlugins[pluginName];
    var pluginIndex = EventPluginOrder.indexOf(pluginName);
    invariant(pluginIndex > -1);
    if (EventPluginRegistry.plugins[pluginIndex]) {
      continue;
    }
    invariant(PluginModule.extractEvents);
    EventPluginRegistry.plugins[pluginIndex] = PluginModule;
    var publishedEvents = PluginModule.eventTypes;
    for (var eventName in publishedEvents) {
      invariant(publishEventForPlugin(publishedEvents[eventName], PluginModule));
    }
  }
}

/**
 * Publishes an event so that it can be dispatched by the supplied plugin.
 *
 * @param {object} dispatchConfig Dispatch configuration for the event.
 * @param {object} PluginModule Plugin publishing the event.
 * @return {boolean} True if the event was successfully published.
 * @private
 */
function publishEventForPlugin(dispatchConfig, PluginModule) {
  var phasedRegistrationNames = dispatchConfig.phasedRegistrationNames;
  if (phasedRegistrationNames) {
    for (var phaseName in phasedRegistrationNames) {
      if (phasedRegistrationNames.hasOwnProperty(phaseName)) {
        var phasedRegistrationName = phasedRegistrationNames[phaseName];
        publishRegistrationName(phasedRegistrationName, PluginModule);
      }
    }
    return true;
  } else if (dispatchConfig.registrationName) {
    publishRegistrationName(dispatchConfig.registrationName, PluginModule);
    return true;
  }
  return false;
}

/**
 * Publishes a registration name that is used to identify dispatched events and
 * can be used with `EventPluginHub.putListener` to register listeners.
 *
 * @param {string} registrationName Registration name to add.
 * @param {object} PluginModule Plugin publishing the event.
 * @private
 */
function publishRegistrationName(registrationName, PluginModule) {
  invariant(!EventPluginRegistry.registrationNames[registrationName]);
  EventPluginRegistry.registrationNames[registrationName] = PluginModule;
  EventPluginRegistry.registrationNamesKeys.push(registrationName);
}

/**
 * Registers plugins so that they can extract and dispatch events.
 *
 * @see {EventPluginHub}
 */
var EventPluginRegistry = {

  /**
   * Ordered list of injected plugins.
   */
  plugins: [],

  /**
   * Mapping from registration names to plugin modules.
   */
  registrationNames: {},

  /**
   * The keys of `registrationNames`.
   */
  registrationNamesKeys: [],

  /**
   * Injects an ordering of plugins (by plugin name). This allows the ordering
   * to be decoupled from injection of the actual plugins so that ordering is
   * always deterministic regardless of packaging, on-the-fly injection, etc.
   *
   * @param {array} InjectedEventPluginOrder
   * @internal
   * @see {EventPluginHub.injection.injectEventPluginOrder}
   */
  injectEventPluginOrder: function(InjectedEventPluginOrder) {
    invariant(!EventPluginOrder);
    // Clone the ordering so it cannot be dynamically mutated.
    EventPluginOrder = Array.prototype.slice.call(InjectedEventPluginOrder);
    recomputePluginOrdering();
  },

  /**
   * Injects plugins to be used by `EventPluginHub`. The plugin names must be
   * in the ordering injected by `injectEventPluginOrder`.
   *
   * Plugins can be injected as part of page initialization or on-the-fly.
   *
   * @param {object} injectedNamesToPlugins Map from names to plugin modules.
   * @internal
   * @see {EventPluginHub.injection.injectEventPluginsByName}
   */
  injectEventPluginsByName: function(injectedNamesToPlugins) {
    var isOrderingDirty = false;
    for (var pluginName in injectedNamesToPlugins) {
      if (!injectedNamesToPlugins.hasOwnProperty(pluginName)) {
        continue;
      }
      var PluginModule = injectedNamesToPlugins[pluginName];
      if (namesToPlugins[pluginName] !== PluginModule) {
        invariant(!namesToPlugins[pluginName]);
        namesToPlugins[pluginName] = PluginModule;
        isOrderingDirty = true;
      }
    }
    if (isOrderingDirty) {
      recomputePluginOrdering();
    }
  },

  /**
   * Looks up the plugin for the supplied event.
   *
   * @param {object} event A synthetic event.
   * @return {?object} The plugin that created the supplied event.
   * @internal
   */
  getPluginModuleForEvent: function(event) {
    var dispatchConfig = event.dispatchConfig;
    if (dispatchConfig.registrationName) {
      return EventPluginRegistry.registrationNames[
        dispatchConfig.registrationName
      ] || null;
    }
    for (var phase in dispatchConfig.phasedRegistrationNames) {
      if (!dispatchConfig.phasedRegistrationNames.hasOwnProperty(phase)) {
        continue;
      }
      var PluginModule = EventPluginRegistry.registrationNames[
        dispatchConfig.phasedRegistrationNames[phase]
      ];
      if (PluginModule) {
        return PluginModule;
      }
    }
    return null;
  },

  /**
   * Exposed for unit testing.
   * @private
   */
  _resetEventPlugins: function() {
    EventPluginOrder = null;
    for (var pluginName in namesToPlugins) {
      if (namesToPlugins.hasOwnProperty(pluginName)) {
        delete namesToPlugins[pluginName];
      }
    }
    EventPluginRegistry.plugins.length = 0;
    var registrationNames = EventPluginRegistry.registrationNames;
    for (var registrationName in registrationNames) {
      if (registrationNames.hasOwnProperty(registrationName)) {
        delete registrationNames[registrationName];
      }
    }
    EventPluginRegistry.registrationNamesKeys.length = 0;
  }

};

module.exports = EventPluginRegistry;

},{"./invariant":"hPxNWC"}],"K4QB+L":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule EventPluginUtils
 */

"use strict";
var EventConstants = require("./EventConstants");
var invariant = require("./invariant");
var topLevelTypes = EventConstants.topLevelTypes;

function isEndish(topLevelType) {
  return topLevelType === topLevelTypes.topMouseUp ||
         topLevelType === topLevelTypes.topTouchEnd ||
         topLevelType === topLevelTypes.topTouchCancel;
}

function isMoveish(topLevelType) {
  return topLevelType === topLevelTypes.topMouseMove ||
         topLevelType === topLevelTypes.topTouchMove;
}

function isStartish(topLevelType) {
  return topLevelType === topLevelTypes.topMouseDown ||
         topLevelType === topLevelTypes.topTouchStart;
}

var validateEventDispatches;

/**
 * Invokes `cb(event, listener, id)`. Avoids using call if no scope is
 * provided. The `(listener,id)` pair effectively forms the "dispatch" but are
 * kept separate to conserve memory.
 */
function forEachEventDispatch(event, cb) {
    var dispatchListeners = event._dispatchListeners;
    var dispatchIDs = event._dispatchIDs;

    if (Array.isArray(dispatchListeners)) {
      for (var i = 0; i < dispatchListeners.length; i++) {
        if (event.isPropagationStopped()) {
          break;
        }
        // Listeners and IDs are two parallel arrays that are always in sync.
        cb(event, dispatchListeners[i], dispatchIDs[i]);
      }
    } else if (dispatchListeners) {
      cb(event, dispatchListeners, dispatchIDs);
    }
}

/**
 * Default implementation of PluginModule.executeDispatch().
 * @param {SyntheticEvent} SyntheticEvent to handle
 * @param {function} Application-level callback
 * @param {string} domID DOM id to pass to the callback.
 */
function executeDispatch(event, listener, domID) {
  listener(event, domID);
}

/**
 * Standard/simple iteration through an event's collected dispatches.
 */
function executeDispatchesInOrder(event, executeDispatch) {
  forEachEventDispatch(event, executeDispatch);
  event._dispatchListeners = null;
  event._dispatchIDs = null;
}

/**
 * Standard/simple iteration through an event's collected dispatches, but stops
 * at the first dispatch execution returning true, and returns that id.
 *
 * @return id of the first dispatch execution who's listener returns true, or
 * null if no listener returned true.
 */
function executeDispatchesInOrderStopAtTrue(event) {
    var dispatchListeners = event._dispatchListeners;
    var dispatchIDs = event._dispatchIDs;

    if (Array.isArray(dispatchListeners)) {
      for (var i = 0; i < dispatchListeners.length; i++) {
        if (event.isPropagationStopped()) {
          break;
        }
        // Listeners and IDs are two parallel arrays that are always in sync.
        if (dispatchListeners[i](event, dispatchIDs[i])) {
          return dispatchIDs[i];
        }
      }
    } else if (dispatchListeners) {
      if (dispatchListeners(event, dispatchIDs)) {
        return dispatchIDs;
      }
    }

    return null;
}

/**
 * Execution of a "direct" dispatch - there must be at most one dispatch
 * accumulated on the event or it is considered an error. It doesn't really make
 * sense for an event with multiple dispatches (bubbled) to keep track of the
 * return values at each dispatch execution, but it does tend to make sense when
 * dealing with "direct" dispatches.
 *
 * @return The return value of executing the single dispatch.
 */
function executeDirectDispatch(event) {
    var dispatchListener = event._dispatchListeners;
    var dispatchID = event._dispatchIDs;
    invariant(!Array.isArray(dispatchListener));

    var res = dispatchListener ?
      dispatchListener(event, dispatchID) :
      null;

    event._dispatchListeners = null;
    event._dispatchIDs = null;
    return res;
}

/**
 * @param {SyntheticEvent} event
 * @return {bool} True iff number of dispatches accumulated is greater than 0.
 */
function hasDispatches(event) {
  return !!event._dispatchListeners;
}

/**
 * General utilities that are useful in creating custom Event Plugins.
 */
var EventPluginUtils = {
  isEndish: isEndish,
  isMoveish: isMoveish,
  isStartish: isStartish,
  executeDispatchesInOrder: executeDispatchesInOrder,
  executeDispatchesInOrderStopAtTrue: executeDispatchesInOrderStopAtTrue,
  executeDirectDispatch: executeDirectDispatch,
  hasDispatches: hasDispatches,
  executeDispatch: executeDispatch
};

module.exports = EventPluginUtils;

},{"./EventConstants":"Gaqr6V","./invariant":"hPxNWC"}],"n/zMdI":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule EventPropagators
 */

"use strict";

var CallbackRegistry = require("./CallbackRegistry");
var EventConstants = require("./EventConstants");

var accumulate = require("./accumulate");
var forEachAccumulated = require("./forEachAccumulated");
var getListener = CallbackRegistry.getListener;
var PropagationPhases = EventConstants.PropagationPhases;

/**
 * Injected dependencies:
 */

/**
 * - `InstanceHandle`: [required] Module that performs logical traversals of DOM
 *   hierarchy given ids of the logical DOM elements involved.
 */
var injection = {
  InstanceHandle: null,
  injectInstanceHandle: function(InjectedInstanceHandle) {
      injection.InstanceHandle = InjectedInstanceHandle;
  },
  validate: function() {
    var invalid = !injection.InstanceHandle||
      !injection.InstanceHandle.traverseTwoPhase ||
      !injection.InstanceHandle.traverseEnterLeave;
    if (invalid) {
      throw new Error('InstanceHandle not injected before use!');
    }
  }
};

/**
 * Some event types have a notion of different registration names for different
 * "phases" of propagation. This finds listeners by a given phase.
 */
function listenerAtPhase(id, event, propagationPhase) {
  var registrationName =
    event.dispatchConfig.phasedRegistrationNames[propagationPhase];
  return getListener(id, registrationName);
}

/**
 * Tags a `SyntheticEvent` with dispatched listeners. Creating this function
 * here, allows us to not have to bind or create functions for each event.
 * Mutating the event's members allows us to not have to create a wrapping
 * "dispatch" object that pairs the event with the listener.
 */
function accumulateDirectionalDispatches(domID, upwards, event) {
    var phase = upwards ? PropagationPhases.bubbled : PropagationPhases.captured;
    var listener = listenerAtPhase(domID, event, phase);

    if (listener) {
      event._dispatchListeners = accumulate(event._dispatchListeners, listener);
      event._dispatchIDs = accumulate(event._dispatchIDs, domID);
    }
}

/**
 * Collect dispatches (must be entirely collected before dispatching - see unit
 * tests). Lazily allocate the array to conserve memory.  We must loop through
 * each event and perform the traversal for each one. We can not perform a
 * single traversal for the entire collection of events because each event may
 * have a different target.
 */
function accumulateTwoPhaseDispatchesSingle(event) {
  if (event && event.dispatchConfig.phasedRegistrationNames) {
    injection.InstanceHandle.traverseTwoPhase(
      event.dispatchMarker,
      accumulateDirectionalDispatches,
      event
    );
  }
}


/**
 * Accumulates without regard to direction, does not look for phased
 * registration names. Same as `accumulateDirectDispatchesSingle` but without
 * requiring that the `dispatchMarker` be the same as the dispatched ID.
 */
function accumulateDispatches(id, ignoredDirection, event) {
  if (event && event.dispatchConfig.registrationName) {
    var registrationName = event.dispatchConfig.registrationName;
    var listener = getListener(id, registrationName);
    if (listener) {
      event._dispatchListeners = accumulate(event._dispatchListeners, listener);
      event._dispatchIDs = accumulate(event._dispatchIDs, id);
    }
  }
}

/**
 * Accumulates dispatches on an `SyntheticEvent`, but only for the
 * `dispatchMarker`.
 * @param {SyntheticEvent} event
 */
function accumulateDirectDispatchesSingle(event) {
  if (event && event.dispatchConfig.registrationName) {
    accumulateDispatches(event.dispatchMarker, null, event);
  }
}

function accumulateTwoPhaseDispatches(events) {
    forEachAccumulated(events, accumulateTwoPhaseDispatchesSingle);
}

function accumulateEnterLeaveDispatches(leave, enter, fromID, toID) {
    injection.InstanceHandle.traverseEnterLeave(
      fromID,
      toID,
      accumulateDispatches,
      leave,
      enter
    );
}


function accumulateDirectDispatches(events) {
    forEachAccumulated(events, accumulateDirectDispatchesSingle);
}



/**
 * A small set of propagation patterns, each of which will accept a small amount
 * of information, and generate a set of "dispatch ready event objects" - which
 * are sets of events that have already been annotated with a set of dispatched
 * listener functions/ids. The API is designed this way to discourage these
 * propagation strategies from actually executing the dispatches, since we
 * always want to collect the entire set of dispatches before executing event a
 * single one.
 *
 * @constructor EventPropagators
 */
var EventPropagators = {
  accumulateTwoPhaseDispatches: accumulateTwoPhaseDispatches,
  accumulateDirectDispatches: accumulateDirectDispatches,
  accumulateEnterLeaveDispatches: accumulateEnterLeaveDispatches,
  injection: injection
};

module.exports = EventPropagators;

},{"./CallbackRegistry":"L1h3na","./EventConstants":"Gaqr6V","./accumulate":"rpm6kU","./forEachAccumulated":"pcy7SL"}],"mrmvk9":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ExecutionEnvironment
 */

/*jslint evil: true */

"use strict";

var canUseDOM = typeof window !== 'undefined';

/**
 * Simple, lightweight module assisting with the detection and context of
 * Worker. Helps avoid circular dependencies and allows code to reason about
 * whether or not they are in a Worker, even if they never include the main
 * `ReactWorker` dependency.
 */
var ExecutionEnvironment = {

  canUseDOM: canUseDOM,

  canUseWorkers: typeof Worker !== 'undefined',

  isInWorker: !canUseDOM, // For now, this is true - might change in the future.

  global: new Function('return this;')()

};

module.exports = ExecutionEnvironment;

},{}],"OHn5BI":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule MobileSafariClickEventPlugin
 * @typechecks static-only
 */

"use strict";

var EventConstants = require("./EventConstants");

var emptyFunction = require("./emptyFunction");

var topLevelTypes = EventConstants.topLevelTypes;

/**
 * Mobile Safari does not fire properly bubble click events on non-interactive
 * elements, which means delegated click listeners do not fire. The workaround
 * for this bug involves attaching an empty click listener on the target node.
 *
 * This particular plugin works around the bug by attaching an empty click
 * listener on `touchstart` (which does fire on every element).
 */
var MobileSafariClickEventPlugin = {

  eventTypes: null,

  /**
   * @param {string} topLevelType Record from `EventConstants`.
   * @param {DOMEventTarget} topLevelTarget The listening component root node.
   * @param {string} topLevelTargetID ID of `topLevelTarget`.
   * @param {object} nativeEvent Native browser event.
   * @return {*} An accumulation of synthetic events.
   * @see {EventPluginHub.extractEvents}
   */
  extractEvents: function(
      topLevelType,
      topLevelTarget,
      topLevelTargetID,
      nativeEvent) {
    if (topLevelType === topLevelTypes.topTouchStart) {
      var target = nativeEvent.target;
      if (target && !target.onclick) {
        target.onclick = emptyFunction;
      }
    }
  }

};

module.exports = MobileSafariClickEventPlugin;

},{"./EventConstants":"Gaqr6V","./emptyFunction":"RxjlFd"}],"5mz1Gs":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule PooledClass
 */

"use strict";

/**
 * Static poolers. Several custom versions for each potential number of
 * arguments. A completely generic pooler is easy to implement, but would
 * require accessing the `arguments` object. In each of these, `this` refers to
 * the Class itself, not an instance. If any others are needed, simply add them
 * here, or in their own files.
 */
var oneArgumentPooler = function(copyFieldsFrom) {
  var Klass = this;
  if (Klass.instancePool.length) {
    var instance = Klass.instancePool.pop();
    Klass.call(instance, copyFieldsFrom);
    return instance;
  } else {
    return new Klass(copyFieldsFrom);
  }
};

var twoArgumentPooler = function(a1, a2) {
  var Klass = this;
  if (Klass.instancePool.length) {
    var instance = Klass.instancePool.pop();
    Klass.call(instance, a1, a2);
    return instance;
  } else {
    return new Klass(a1, a2);
  }
};

var threeArgumentPooler = function(a1, a2, a3) {
  var Klass = this;
  if (Klass.instancePool.length) {
    var instance = Klass.instancePool.pop();
    Klass.call(instance, a1, a2, a3);
    return instance;
  } else {
    return new Klass(a1, a2, a3);
  }
};

var fiveArgumentPooler = function(a1, a2, a3, a4, a5) {
  var Klass = this;
  if (Klass.instancePool.length) {
    var instance = Klass.instancePool.pop();
    Klass.call(instance, a1, a2, a3, a4, a5);
    return instance;
  } else {
    return new Klass(a1, a2, a3, a4, a5);
  }
};

var standardReleaser = function(instance) {
  var Klass = this;
  if (instance.destructor) {
    instance.destructor();
  }
  if (Klass.instancePool.length < Klass.poolSize) {
    Klass.instancePool.push(instance);
  }
};

var DEFAULT_POOL_SIZE = 10;
var DEFAULT_POOLER = oneArgumentPooler;

/**
 * Augments `CopyConstructor` to be a poolable class, augmenting only the class
 * itself (statically) not adding any prototypical fields. Any CopyConstructor
 * you give this may have a `poolSize` property, and will look for a
 * prototypical `destructor` on instances (optional).
 *
 * @param {Function} CopyConstructor Constructor that can be used to reset.
 * @param {Function} pooler Customizable pooler.
 */
var addPoolingTo = function(CopyConstructor, pooler) {
  var NewKlass = CopyConstructor;
  NewKlass.instancePool = [];
  NewKlass.getPooled = pooler || DEFAULT_POOLER;
  if (!NewKlass.poolSize) {
    NewKlass.poolSize = DEFAULT_POOL_SIZE;
  }
  NewKlass.release = standardReleaser;
  return NewKlass;
};

var PooledClass = {
  addPoolingTo: addPoolingTo,
  oneArgumentPooler: oneArgumentPooler,
  twoArgumentPooler: twoArgumentPooler,
  threeArgumentPooler: threeArgumentPooler,
  fiveArgumentPooler: fiveArgumentPooler
};

module.exports = PooledClass;

},{}],"53xxmY":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule React
 */

"use strict";

var ReactChildren = require("./ReactChildren");
var ReactCompositeComponent = require("./ReactCompositeComponent");
var ReactComponent = require("./ReactComponent");
var ReactDOM = require("./ReactDOM");
var ReactMount = require("./ReactMount");
var ReactPerf = require("./ReactPerf");
var ReactPropTypes = require("./ReactPropTypes");
var ReactServerRendering = require("./ReactServerRendering");

var ReactDefaultInjection = require("./ReactDefaultInjection");

ReactDefaultInjection.inject();

var React = {
  DOM: ReactDOM,
  PropTypes: ReactPropTypes,
  initializeTouchEvents: function(shouldUseTouch) {
    ReactMount.useTouchEvents = shouldUseTouch;
  },
  autoBind: ReactCompositeComponent.autoBind,
  createClass: ReactCompositeComponent.createClass,
  constructAndRenderComponent: ReactMount.constructAndRenderComponent,
  constructAndRenderComponentByID: ReactMount.constructAndRenderComponentByID,
  forEachChildren: ReactChildren.forEach,
  mapChildren: ReactChildren.map,
  renderComponent: ReactPerf.measure(
    'React',
    'renderComponent',
    ReactMount.renderComponent
  ),
  renderComponentToString: ReactServerRendering.renderComponentToString,
  unmountAndReleaseReactRootNode: ReactMount.unmountAndReleaseReactRootNode,
  isValidClass: ReactCompositeComponent.isValidClass,
  isValidComponent: ReactComponent.isValidComponent
};

module.exports = React;

},{"./ReactChildren":"7bESex","./ReactComponent":"RDDX+O","./ReactCompositeComponent":"nAvIQF","./ReactDOM":"6GzACJ","./ReactDefaultInjection":"oRxGN0","./ReactMount":"1R+7Eu","./ReactPerf":"S6hUyz","./ReactPropTypes":"9axgbZ","./ReactServerRendering":"JvdSDI"}],"7bESex":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactChildren
 */

"use strict";

var PooledClass = require("./PooledClass");

var invariant = require("./invariant");
var traverseAllChildren = require("./traverseAllChildren");

var twoArgumentPooler = PooledClass.twoArgumentPooler;
var threeArgumentPooler = PooledClass.threeArgumentPooler;

/**
 * PooledClass representing the bookkeeping associated with performing a child
 * traversal. Allows avoiding binding callbacks.
 *
 * @constructor ForEachBookKeeping
 * @param {!function} forEachFunction Function to perform traversal with.
 * @param {?*} forEachContext Context to perform context with.
 */
function ForEachBookKeeping(forEachFunction, forEachContext) {
  this.forEachFunction = forEachFunction;
  this.forEachContext = forEachContext;
}
PooledClass.addPoolingTo(ForEachBookKeeping, twoArgumentPooler);

function forEachSingleChild(traverseContext, child, name, i) {
  var forEachBookKeeping = traverseContext;
  forEachBookKeeping.forEachFunction.call(
    forEachBookKeeping.forEachContext, child, i);
}

/**
 * Iterates through children that are typically specified as `props.children`.
 *
 * The provided forEachFunc(child, index) will be called for each
 * leaf child.
 *
 * @param {array} children
 * @param {function(*, int)} forEachFunc.
 * @param {*} forEachContext Context for forEachContext.
 */
function forEachChildren(children, forEachFunc, forEachContext) {
  if (children == null) {
    return children;
  }

  var traverseContext =
    ForEachBookKeeping.getPooled(forEachFunc, forEachContext);
  traverseAllChildren(children, forEachSingleChild, traverseContext);
  ForEachBookKeeping.release(traverseContext);
}

/**
 * PooledClass representing the bookkeeping associated with performing a child
 * mapping. Allows avoiding binding callbacks.
 *
 * @constructor MapBookKeeping
 * @param {!*} mapResult Object containing the ordered map of results.
 * @param {!function} mapFunction Function to perform mapping with.
 * @param {?*} mapContext Context to perform mapping with.
 */
function MapBookKeeping(mapResult, mapFunction, mapContext) {
  this.mapResult = mapResult;
  this.mapFunction = mapFunction;
  this.mapContext = mapContext;
}
PooledClass.addPoolingTo(MapBookKeeping, threeArgumentPooler);

function mapSingleChildIntoContext(traverseContext, child, name, i) {
  var mapBookKeeping = traverseContext;
  var mapResult = mapBookKeeping.mapResult;
  var mappedChild =
    mapBookKeeping.mapFunction.call(mapBookKeeping.mapContext, child, i);
  // We found a component instance
  invariant(!mapResult.hasOwnProperty(name));
  mapResult[name] = mappedChild;
}

/**
 * Maps children that are typically specified as `props.children`.
 *
 * The provided mapFunction(child, key, index) will be called for each
 * leaf child.
 *
 * TODO: This may likely break any calls to `ReactChildren.map` that were
 * previously relying on the fact that we guarded against null children.
 *
 * @param {array} children
 * @param {function(*, int)} mapFunction.
 * @param {*} mapContext Context for mapFunction.
 * @return {array} mirrored array with mapped children.
 */
function mapChildren(children, func, context) {
  if (children == null) {
    return children;
  }

  var mapResult = {};
  var traverseContext = MapBookKeeping.getPooled(mapResult, func, context);
  traverseAllChildren(children, mapSingleChildIntoContext, traverseContext);
  MapBookKeeping.release(traverseContext);
  return mapResult;
}

var ReactChildren = {
  forEach: forEachChildren,
  map: mapChildren
};

module.exports = ReactChildren;

},{"./PooledClass":"5mz1Gs","./invariant":"hPxNWC","./traverseAllChildren":"27ud2W"}],"RDDX+O":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactComponent
 */

"use strict";

var ReactComponentEnvironment = require("./ReactComponentEnvironment");
var ReactCurrentOwner = require("./ReactCurrentOwner");
var ReactOwner = require("./ReactOwner");
var ReactUpdates = require("./ReactUpdates");

var invariant = require("./invariant");
var keyMirror = require("./keyMirror");
var merge = require("./merge");

/**
 * Prop key that references a component's owner.
 * @private
 */
var OWNER = '{owner}';

/**
 * Props key that determines if a component's key was already validated.
 * @private
 */
var IS_KEY_VALIDATED = '{is.key.validated}';

/**
 * Every React component is in one of these life cycles.
 */
var ComponentLifeCycle = keyMirror({
  /**
   * Mounted components have a DOM node representation and are capable of
   * receiving new props.
   */
  MOUNTED: null,
  /**
   * Unmounted components are inactive and cannot receive new props.
   */
  UNMOUNTED: null
});

/**
 * Warn if there's no key explicitly set on dynamic arrays of children.
 * This allows us to keep track of children between updates.
 */

var ownerHasWarned = {};

/**
 * Warn if the component doesn't have an explicit key assigned to it.
 * This component is in an array. The array could grow and shrink or be
 * reordered. All children, that hasn't already been validated, are required to
 * have a "key" property assigned to it.
 *
 * @internal
 * @param {ReactComponent} component Component that requires a key.
 */
function validateExplicitKey(component) {
  if (component[IS_KEY_VALIDATED] || component.props.key != null) {
    return;
  }
  component[IS_KEY_VALIDATED] = true;

  // We can't provide friendly warnings for top level components.
  if (!ReactCurrentOwner.current) {
    return;
  }

  // Name of the component whose render method tried to pass children.
  var currentName = ReactCurrentOwner.current.constructor.displayName;
  if (ownerHasWarned.hasOwnProperty(currentName)) {
    return;
  }
  ownerHasWarned[currentName] = true;

  var message = 'Each child in an array should have a unique "key" prop. ' +
                'Check the render method of ' + currentName + '.';
  if (!component.isOwnedBy(ReactCurrentOwner.current)) {
    // Name of the component that originally created this child.
    var childOwnerName =
      component.props[OWNER] && component.props[OWNER].constructor.displayName;

    // Usually the current owner is the offender, but if it accepts
    // children as a property, it may be the creator of the child that's
    // responsible for assigning it a key.
    message += ' It was passed a child from ' + childOwnerName + '.';
  }

  console.warn(message);
}

/**
 * Ensure that every component either is passed in a static location or, if
 * if it's passed in an array, has an explicit key property defined.
 *
 * @internal
 * @param {*} component Statically passed child of any type.
 * @return {boolean}
 */
function validateChildKeys(component) {
  if (Array.isArray(component)) {
    for (var i = 0; i < component.length; i++) {
      var child = component[i];
      if (ReactComponent.isValidComponent(child)) {
        validateExplicitKey(child);
      }
    }
  } else if (ReactComponent.isValidComponent(component)) {
    // This component was passed in a valid location.
    component[IS_KEY_VALIDATED] = true;
  }
}

/**
 * Components are the basic units of composition in React.
 *
 * Every component accepts a set of keyed input parameters known as "props" that
 * are initialized by the constructor. Once a component is mounted, the props
 * can be mutated using `setProps` or `replaceProps`.
 *
 * Every component is capable of the following operations:
 *
 *   `mountComponent`
 *     Initializes the component, renders markup, and registers event listeners.
 *
 *   `receiveProps`
 *     Updates the rendered DOM nodes given a new set of props.
 *
 *   `unmountComponent`
 *     Releases any resources allocated by this component.
 *
 * Components can also be "owned" by other components. Being owned by another
 * component means being constructed by that component. This is different from
 * being the child of a component, which means having a DOM representation that
 * is a child of the DOM representation of that component.
 *
 * @class ReactComponent
 */
var ReactComponent = {

  /**
   * @param {?object} object
   * @return {boolean} True if `object` is a valid component.
   * @final
   */
  isValidComponent: function(object) {
    return !!(
      object &&
      typeof object.mountComponentIntoNode === 'function' &&
      typeof object.receiveProps === 'function'
    );
  },

  /**
   * Generate a key string that identifies a component within a set.
   *
   * @param {*} component A component that could contain a manual key.
   * @param {number} index Index that is used if a manual key is not provided.
   * @return {string}
   * @internal
   */
  getKey: function(component, index) {
    if (component && component.props && component.props.key != null) {
      // Explicit key
      return '{' + component.props.key + '}';
    }
    // Implicit key determined by the index in the set
    return '[' + index + ']';
  },

  /**
   * @internal
   */
  LifeCycle: ComponentLifeCycle,

  /**
   * Injected module that provides ability to mutate individual properties.
   * Injected into the base class because many different subclasses need access
   * to this.
   *
   * @internal
   */
  DOMIDOperations: ReactComponentEnvironment.DOMIDOperations,

  /**
   * Optionally injectable environment dependent cleanup hook. (server vs.
   * browser etc). Example: A browser system caches DOM nodes based on component
   * ID and must remove that cache entry when this instance is unmounted.
   *
   * @private
   */
  unmountIDFromEnvironment: ReactComponentEnvironment.unmountIDFromEnvironment,

  /**
   * The "image" of a component tree, is the platform specific (typically
   * serialized) data that represents a tree of lower level UI building blocks.
   * On the web, this "image" is HTML markup which describes a construction of
   * low level `div` and `span` nodes. Other platforms may have different
   * encoding of this "image". This must be injected.
   *
   * @private
   */
  mountImageIntoNode: ReactComponentEnvironment.mountImageIntoNode,

  /**
   * React references `ReactReconcileTransaction` using this property in order
   * to allow dependency injection.
   *
   * @internal
   */
  ReactReconcileTransaction:
    ReactComponentEnvironment.ReactReconcileTransaction,

  /**
   * Base functionality for every ReactComponent constructor. Mixed into the
   * `ReactComponent` prototype, but exposed statically for easy access.
   *
   * @lends {ReactComponent.prototype}
   */
  Mixin: merge(ReactComponentEnvironment.Mixin, {

    /**
     * Checks whether or not this component is mounted.
     *
     * @return {boolean} True if mounted, false otherwise.
     * @final
     * @protected
     */
    isMounted: function() {
      return this._lifeCycleState === ComponentLifeCycle.MOUNTED;
    },

    /**
     * Sets a subset of the props.
     *
     * @param {object} partialProps Subset of the next props.
     * @param {?function} callback Called after props are updated.
     * @final
     * @public
     */
    setProps: function(partialProps, callback) {
      // Merge with `_pendingProps` if it exists, otherwise with existing props.
      this.replaceProps(
        merge(this._pendingProps || this.props, partialProps),
        callback
      );
    },

    /**
     * Replaces all of the props.
     *
     * @param {object} props New props.
     * @param {?function} callback Called after props are updated.
     * @final
     * @public
     */
    replaceProps: function(props, callback) {
      invariant(!this.props[OWNER]);
      this._pendingProps = props;
      ReactUpdates.enqueueUpdate(this, callback);
    },

    /**
     * Base constructor for all React component.
     *
     * Subclasses that override this method should make sure to invoke
     * `ReactComponent.Mixin.construct.call(this, ...)`.
     *
     * @param {?object} initialProps
     * @param {*} children
     * @internal
     */
    construct: function(initialProps, children) {
      this.props = initialProps || {};
      // Record the component responsible for creating this component.
      this.props[OWNER] = ReactCurrentOwner.current;
      // All components start unmounted.
      this._lifeCycleState = ComponentLifeCycle.UNMOUNTED;

      this._pendingProps = null;
      this._pendingCallbacks = null;

      // Children can be more than one argument
      var childrenLength = arguments.length - 1;
      if (childrenLength === 1) {
          this.props.children = children;
      } else if (childrenLength > 1) {
        var childArray = Array(childrenLength);
        for (var i = 0; i < childrenLength; i++) {
            childArray[i] = arguments[i + 1];
        }
        this.props.children = childArray;
      }
    },

    /**
     * Initializes the component, renders markup, and registers event listeners.
     *
     * NOTE: This does not insert any nodes into the DOM.
     *
     * Subclasses that override this method should make sure to invoke
     * `ReactComponent.Mixin.mountComponent.call(this, ...)`.
     *
     * @param {string} rootID DOM ID of the root node.
     * @param {ReactReconcileTransaction} transaction
     * @return {?string} Rendered markup to be inserted into the DOM.
     * @internal
     */
    mountComponent: function(rootID, transaction) {
      invariant(!this.isMounted());
      var props = this.props;
      if (props.ref != null) {
        ReactOwner.addComponentAsRefTo(this, props.ref, props[OWNER]);
      }
      this._rootNodeID = rootID;
      this._lifeCycleState = ComponentLifeCycle.MOUNTED;
      // Effectively: return '';
    },

    /**
     * Releases any resources allocated by `mountComponent`.
     *
     * NOTE: This does not remove any nodes from the DOM.
     *
     * Subclasses that override this method should make sure to invoke
     * `ReactComponent.Mixin.unmountComponent.call(this)`.
     *
     * @internal
     */
    unmountComponent: function() {
      invariant(this.isMounted());
      var props = this.props;
      if (props.ref != null) {
        ReactOwner.removeComponentAsRefFrom(this, props.ref, props[OWNER]);
      }
      ReactComponent.unmountIDFromEnvironment(this._rootNodeID);
      this._rootNodeID = null;
      this._lifeCycleState = ComponentLifeCycle.UNMOUNTED;
    },

    /**
     * Updates the rendered DOM nodes given a new set of props.
     *
     * Subclasses that override this method should make sure to invoke
     * `ReactComponent.Mixin.receiveProps.call(this, ...)`.
     *
     * @param {object} nextProps Next set of properties.
     * @param {ReactReconcileTransaction} transaction
     * @internal
     */
    receiveProps: function(nextProps, transaction) {
      invariant(this.isMounted());
      this._pendingProps = nextProps;
      this._performUpdateIfNecessary(transaction);
    },

    /**
     * Call `_performUpdateIfNecessary` within a new transaction.
     *
     * @param {ReactReconcileTransaction} transaction
     * @internal
     */
    performUpdateIfNecessary: function() {
      var transaction = ReactComponent.ReactReconcileTransaction.getPooled();
      transaction.perform(this._performUpdateIfNecessary, this, transaction);
      ReactComponent.ReactReconcileTransaction.release(transaction);
    },

    /**
     * If `_pendingProps` is set, update the component.
     *
     * @param {ReactReconcileTransaction} transaction
     * @internal
     */
    _performUpdateIfNecessary: function(transaction) {
      if (this._pendingProps == null) {
        return;
      }
      var prevProps = this.props;
      this.props = this._pendingProps;
      this._pendingProps = null;
      this.updateComponent(transaction, prevProps);
    },

    /**
     * Updates the component's currently mounted representation.
     *
     * @param {ReactReconcileTransaction} transaction
     * @param {object} prevProps
     * @internal
     */
    updateComponent: function(transaction, prevProps) {
      var props = this.props;
      // If either the owner or a `ref` has changed, make sure the newest owner
      // has stored a reference to `this`, and the previous owner (if different)
      // has forgotten the reference to `this`.
      if (props[OWNER] !== prevProps[OWNER] || props.ref !== prevProps.ref) {
        if (prevProps.ref != null) {
          ReactOwner.removeComponentAsRefFrom(
            this, prevProps.ref, prevProps[OWNER]
          );
        }
        // Correct, even if the owner is the same, and only the ref has changed.
        if (props.ref != null) {
          ReactOwner.addComponentAsRefTo(this, props.ref, props[OWNER]);
        }
      }
    },

    /**
     * Mounts this component and inserts it into the DOM.
     *
     * @param {string} rootID DOM ID of the root node.
     * @param {DOMElement} container DOM element to mount into.
     * @param {boolean} shouldReuseMarkup If true, do not insert markup
     * @final
     * @internal
     * @see {ReactMount.renderComponent}
     */
    mountComponentIntoNode: function(rootID, container, shouldReuseMarkup) {
      var transaction = ReactComponent.ReactReconcileTransaction.getPooled();
      transaction.perform(
        this._mountComponentIntoNode,
        this,
        rootID,
        container,
        transaction,
        shouldReuseMarkup
      );
      ReactComponent.ReactReconcileTransaction.release(transaction);
    },

    /**
     * @param {string} rootID DOM ID of the root node.
     * @param {DOMElement} container DOM element to mount into.
     * @param {ReactReconcileTransaction} transaction
     * @param {boolean} shouldReuseMarkup If true, do not insert markup
     * @final
     * @private
     */
    _mountComponentIntoNode: function(
        rootID,
        container,
        transaction,
        shouldReuseMarkup) {
      var markup = this.mountComponent(rootID, transaction);
      ReactComponent.mountImageIntoNode(markup, container, shouldReuseMarkup);
    },

    /**
     * Checks if this component is owned by the supplied `owner` component.
     *
     * @param {ReactComponent} owner Component to check.
     * @return {boolean} True if `owners` owns this component.
     * @final
     * @internal
     */
    isOwnedBy: function(owner) {
      return this.props[OWNER] === owner;
    },

    /**
     * Gets another component, that shares the same owner as this one, by ref.
     *
     * @param {string} ref of a sibling Component.
     * @return {?ReactComponent} the actual sibling Component.
     * @final
     * @internal
     */
    getSiblingByRef: function(ref) {
      var owner = this.props[OWNER];
      if (!owner || !owner.refs) {
        return null;
      }
      return owner.refs[ref];
    }
  })
};

module.exports = ReactComponent;

},{"./ReactComponentEnvironment":"kOHKbO","./ReactCurrentOwner":"j7aNlU","./ReactOwner":"YwelYh","./ReactUpdates":"dwYRw4","./invariant":"hPxNWC","./keyMirror":"n1FgJb","./merge":"7duoWY"}],"+VDCcA":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactComponentBrowserEnvironment
 */

/*jslint evil: true */

"use strict";

var ReactDOMIDOperations = require("./ReactDOMIDOperations");
var ReactMarkupChecksum = require("./ReactMarkupChecksum");
var ReactMount = require("./ReactMount");
var ReactReconcileTransaction = require("./ReactReconcileTransaction");

var getReactRootElementInContainer = require("./getReactRootElementInContainer");
var invariant = require("./invariant");


var ELEMENT_NODE_TYPE = 1;
var DOC_NODE_TYPE = 9;


/**
 * Abstracts away all functionality of `ReactComponent` requires knowledge of
 * the browser context.
 */
var ReactComponentBrowserEnvironment = {
  /**
   * Mixed into every component instance.
   */
  Mixin: {
    /**
     * Returns the DOM node rendered by this component.
     *
     * @return {DOMElement} The root node of this component.
     * @final
     * @protected
     */
    getDOMNode: function() {
      invariant(this.isMounted());
      return ReactMount.getNode(this._rootNodeID);
    }
  },

  ReactReconcileTransaction: ReactReconcileTransaction,

  DOMIDOperations: ReactDOMIDOperations,

  /**
   * If a particular environment requires that some resources be cleaned up,
   * specify this in the injected Mixin. In the DOM, we would likely want to
   * purge any cached node ID lookups.
   *
   * @private
   */
  unmountIDFromEnvironment: function(rootNodeID) {
    ReactMount.purgeID(rootNodeID);
  },

  /**
   * @param {string} markup Markup string to place into the DOM Element.
   * @param {DOMElement} container DOM Element to insert markup into.
   * @param {boolean} shouldReuseMarkup Should reuse the existing markup in the
   * container if possible.
   */
  mountImageIntoNode: function(markup, container, shouldReuseMarkup) {
    invariant(container && (
      container.nodeType === ELEMENT_NODE_TYPE ||
      container.nodeType === DOC_NODE_TYPE && ReactMount.allowFullPageRender
    ));
    if (shouldReuseMarkup) {
      if (ReactMarkupChecksum.canReuseMarkup(
            markup,
            getReactRootElementInContainer(container))) {
        return;
      } else {}
    }

    // Asynchronously inject markup by ensuring that the container is not in
    // the document when settings its `innerHTML`.
    var parent = container.parentNode;
    if (parent) {
      var next = container.nextSibling;
      parent.removeChild(container);
      container.innerHTML = markup;
      if (next) {
        parent.insertBefore(container, next);
      } else {
        parent.appendChild(container);
      }
    } else {
      container.innerHTML = markup;
    }
  }
};

module.exports = ReactComponentBrowserEnvironment;

},{"./ReactDOMIDOperations":"nRDvnf","./ReactMarkupChecksum":"TUHHsM","./ReactMount":"1R+7Eu","./ReactReconcileTransaction":"38o64s","./getReactRootElementInContainer":"sz+OE9","./invariant":"hPxNWC"}],"kOHKbO":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactComponentEnvironment
 */

var ReactComponentBrowserEnvironment =
  require("./ReactComponentBrowserEnvironment");

var ReactComponentEnvironment = ReactComponentBrowserEnvironment;

module.exports = ReactComponentEnvironment;

},{"./ReactComponentBrowserEnvironment":"+VDCcA"}],"nAvIQF":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactCompositeComponent
 */

"use strict";

var ReactComponent = require("./ReactComponent");
var ReactCurrentOwner = require("./ReactCurrentOwner");
var ReactOwner = require("./ReactOwner");
var ReactPerf = require("./ReactPerf");
var ReactPropTransferer = require("./ReactPropTransferer");
var ReactUpdates = require("./ReactUpdates");

var invariant = require("./invariant");
var keyMirror = require("./keyMirror");
var merge = require("./merge");
var mixInto = require("./mixInto");
var objMap = require("./objMap");

/**
 * Policies that describe methods in `ReactCompositeComponentInterface`.
 */
var SpecPolicy = keyMirror({
  /**
   * These methods may be defined only once by the class specification or mixin.
   */
  DEFINE_ONCE: null,
  /**
   * These methods may be defined by both the class specification and mixins.
   * Subsequent definitions will be chained. These methods must return void.
   */
  DEFINE_MANY: null,
  /**
   * These methods are overriding the base ReactCompositeComponent class.
   */
  OVERRIDE_BASE: null,
  /**
   * These methods are similar to DEFINE_MANY, except we assume they return
   * objects. We try to merge the keys of the return values of all the mixed in
   * functions. If there is a key conflict we throw.
   */
  DEFINE_MANY_MERGED: null
});

/**
 * Composite components are higher-level components that compose other composite
 * or native components.
 *
 * To create a new type of `ReactCompositeComponent`, pass a specification of
 * your new class to `React.createClass`. The only requirement of your class
 * specification is that you implement a `render` method.
 *
 *   var MyComponent = React.createClass({
 *     render: function() {
 *       return <div>Hello World</div>;
 *     }
 *   });
 *
 * The class specification supports a specific protocol of methods that have
 * special meaning (e.g. `render`). See `ReactCompositeComponentInterface` for
 * more the comprehensive protocol. Any other properties and methods in the
 * class specification will available on the prototype.
 *
 * @interface ReactCompositeComponentInterface
 * @internal
 */
var ReactCompositeComponentInterface = {

  /**
   * An array of Mixin objects to include when defining your component.
   *
   * @type {array}
   * @optional
   */
  mixins: SpecPolicy.DEFINE_MANY,

  /**
   * Definition of prop types for this component.
   *
   * @type {object}
   * @optional
   */
  propTypes: SpecPolicy.DEFINE_ONCE,



  // ==== Definition methods ====

  /**
   * Invoked when the component is mounted. Values in the mapping will be set on
   * `this.props` if that prop is not specified (i.e. using an `in` check).
   *
   * This method is invoked before `getInitialState` and therefore cannot rely
   * on `this.state` or use `this.setState`.
   *
   * @return {object}
   * @optional
   */
  getDefaultProps: SpecPolicy.DEFINE_ONCE,

  /**
   * Invoked once before the component is mounted. The return value will be used
   * as the initial value of `this.state`.
   *
   *   getInitialState: function() {
   *     return {
   *       isOn: false,
   *       fooBaz: new BazFoo()
   *     }
   *   }
   *
   * @return {object}
   * @optional
   */
  getInitialState: SpecPolicy.DEFINE_MANY_MERGED,

  /**
   * Uses props from `this.props` and state from `this.state` to render the
   * structure of the component.
   *
   * No guarantees are made about when or how often this method is invoked, so
   * it must not have side effects.
   *
   *   render: function() {
   *     var name = this.props.name;
   *     return <div>Hello, {name}!</div>;
   *   }
   *
   * @return {ReactComponent}
   * @nosideeffects
   * @required
   */
  render: SpecPolicy.DEFINE_ONCE,



  // ==== Delegate methods ====

  /**
   * Invoked when the component is initially created and about to be mounted.
   * This may have side effects, but any external subscriptions or data created
   * by this method must be cleaned up in `componentWillUnmount`.
   *
   * @optional
   */
  componentWillMount: SpecPolicy.DEFINE_MANY,

  /**
   * Invoked when the component has been mounted and has a DOM representation.
   * However, there is no guarantee that the DOM node is in the document.
   *
   * Use this as an opportunity to operate on the DOM when the component has
   * been mounted (initialized and rendered) for the first time.
   *
   * @param {DOMElement} rootNode DOM element representing the component.
   * @optional
   */
  componentDidMount: SpecPolicy.DEFINE_MANY,

  /**
   * Invoked before the component receives new props.
   *
   * Use this as an opportunity to react to a prop transition by updating the
   * state using `this.setState`. Current props are accessed via `this.props`.
   *
   *   componentWillReceiveProps: function(nextProps) {
   *     this.setState({
   *       likesIncreasing: nextProps.likeCount > this.props.likeCount
   *     });
   *   }
   *
   * NOTE: There is no equivalent `componentWillReceiveState`. An incoming prop
   * transition may cause a state change, but the opposite is not true. If you
   * need it, you are probably looking for `componentWillUpdate`.
   *
   * @param {object} nextProps
   * @optional
   */
  componentWillReceiveProps: SpecPolicy.DEFINE_MANY,

  /**
   * Invoked while deciding if the component should be updated as a result of
   * receiving new props and state.
   *
   * Use this as an opportunity to `return false` when you're certain that the
   * transition to the new props and state will not require a component update.
   *
   *   shouldComponentUpdate: function(nextProps, nextState) {
   *     return !equal(nextProps, this.props) || !equal(nextState, this.state);
   *   }
   *
   * @param {object} nextProps
   * @param {?object} nextState
   * @return {boolean} True if the component should update.
   * @optional
   */
  shouldComponentUpdate: SpecPolicy.DEFINE_ONCE,

  /**
   * Invoked when the component is about to update due to a transition from
   * `this.props` and `this.state` to `nextProps` and `nextState`.
   *
   * Use this as an opportunity to perform preparation before an update occurs.
   *
   * NOTE: You **cannot** use `this.setState()` in this method.
   *
   * @param {object} nextProps
   * @param {?object} nextState
   * @param {ReactReconcileTransaction} transaction
   * @optional
   */
  componentWillUpdate: SpecPolicy.DEFINE_MANY,

  /**
   * Invoked when the component's DOM representation has been updated.
   *
   * Use this as an opportunity to operate on the DOM when the component has
   * been updated.
   *
   * @param {object} prevProps
   * @param {?object} prevState
   * @param {DOMElement} rootNode DOM element representing the component.
   * @optional
   */
  componentDidUpdate: SpecPolicy.DEFINE_MANY,

  /**
   * Invoked when the component is about to be removed from its parent and have
   * its DOM representation destroyed.
   *
   * Use this as an opportunity to deallocate any external resources.
   *
   * NOTE: There is no `componentDidUnmount` since your component will have been
   * destroyed by that point.
   *
   * @optional
   */
  componentWillUnmount: SpecPolicy.DEFINE_MANY,



  // ==== Advanced methods ====

  /**
   * Updates the component's currently mounted DOM representation.
   *
   * By default, this implements React's rendering and reconciliation algorithm.
   * Sophisticated clients may wish to override this.
   *
   * @param {ReactReconcileTransaction} transaction
   * @internal
   * @overridable
   */
  updateComponent: SpecPolicy.OVERRIDE_BASE

};

/**
 * Mapping from class specification keys to special processing functions.
 *
 * Although these are declared in the specification when defining classes
 * using `React.createClass`, they will not be on the component's prototype.
 */
var RESERVED_SPEC_KEYS = {
  displayName: function(Constructor, displayName) {
    Constructor.displayName = displayName;
  },
  mixins: function(Constructor, mixins) {
    if (mixins) {
      for (var i = 0; i < mixins.length; i++) {
        mixSpecIntoComponent(Constructor, mixins[i]);
      }
    }
  },
  propTypes: function(Constructor, propTypes) {
    Constructor.propTypes = propTypes;
  }
};

function validateMethodOverride(proto, name) {
  var specPolicy = ReactCompositeComponentInterface[name];

  // Disallow overriding of base class methods unless explicitly allowed.
  if (ReactCompositeComponentMixin.hasOwnProperty(name)) {
    invariant(specPolicy === SpecPolicy.OVERRIDE_BASE);
  }

  // Disallow defining methods more than once unless explicitly allowed.
  if (proto.hasOwnProperty(name)) {
    invariant(specPolicy === SpecPolicy.DEFINE_MANY ||
    specPolicy === SpecPolicy.DEFINE_MANY_MERGED);
  }
}


function validateLifeCycleOnReplaceState(instance) {
  var compositeLifeCycleState = instance._compositeLifeCycleState;
  invariant(instance.isMounted() ||
    compositeLifeCycleState === CompositeLifeCycle.MOUNTING);
  invariant(compositeLifeCycleState !== CompositeLifeCycle.RECEIVING_STATE &&
  compositeLifeCycleState !== CompositeLifeCycle.UNMOUNTING);
}

/**
 * Custom version of `mixInto` which handles policy validation and reserved
 * specification keys when building `ReactCompositeComponent` classses.
 */
function mixSpecIntoComponent(Constructor, spec) {
  var proto = Constructor.prototype;
  for (var name in spec) {
    var property = spec[name];
    if (!spec.hasOwnProperty(name) || !property) {
      continue;
    }
    validateMethodOverride(proto, name);

    if (RESERVED_SPEC_KEYS.hasOwnProperty(name)) {
      RESERVED_SPEC_KEYS[name](Constructor, property);
    } else {
      // Setup methods on prototype:
      // The following member methods should not be automatically bound:
      // 1. Expected ReactCompositeComponent methods (in the "interface").
      // 2. Overridden methods (that were mixed in).
      var isCompositeComponentMethod = name in ReactCompositeComponentInterface;
      var isInherited = name in proto;
      var markedDontBind = property.__reactDontBind;
      var isFunction = typeof property === 'function';
      var shouldAutoBind =
        isFunction &&
        !isCompositeComponentMethod &&
        !isInherited &&
        !markedDontBind;

      if (shouldAutoBind) {
        if (!proto.__reactAutoBindMap) {
          proto.__reactAutoBindMap = {};
        }
        proto.__reactAutoBindMap[name] = property;
        proto[name] = property;
      } else {
        if (isInherited) {
          // For methods which are defined more than once, call the existing
          // methods before calling the new property.
          if (ReactCompositeComponentInterface[name] ===
              SpecPolicy.DEFINE_MANY_MERGED) {
            proto[name] = createMergedResultFunction(proto[name], property);
          } else {
            proto[name] = createChainedFunction(proto[name], property);
          }
        } else {
          proto[name] = property;
        }
      }
    }
  }
}

/**
 * Merge two objects, but throw if both contain the same key.
 *
 * @param {object} one The first object, which is mutated.
 * @param {object} two The second object
 * @return {object} one after it has been mutated to contain everything in two.
 */
function mergeObjectsWithNoDuplicateKeys(one, two) {
  invariant(one && two && typeof one === 'object' && typeof two === 'object');

  objMap(two, function(value, key) {
    invariant(one[key] === undefined);
    one[key] = value;
  });
  return one;
}

/**
 * Creates a function that invokes two functions and merges their return values.
 *
 * @param {function} one Function to invoke first.
 * @param {function} two Function to invoke second.
 * @return {function} Function that invokes the two argument functions.
 * @private
 */
function createMergedResultFunction(one, two) {
  return function mergedResult() {
    return mergeObjectsWithNoDuplicateKeys(
      one.apply(this, arguments),
      two.apply(this, arguments)
    );
  };
}

/**
 * Creates a function that invokes two functions and ignores their return vales.
 *
 * @param {function} one Function to invoke first.
 * @param {function} two Function to invoke second.
 * @return {function} Function that invokes the two argument functions.
 * @private
 */
function createChainedFunction(one, two) {
  return function chainedFunction() {
    one.apply(this, arguments);
    two.apply(this, arguments);
  };
}

/**
 * `ReactCompositeComponent` maintains an auxiliary life cycle state in
 * `this._compositeLifeCycleState` (which can be null).
 *
 * This is different from the life cycle state maintained by `ReactComponent` in
 * `this._lifeCycleState`. The following diagram shows how the states overlap in
 * time. There are times when the CompositeLifeCycle is null - at those times it
 * is only meaningful to look at ComponentLifeCycle alone.
 *
 * Top Row: ReactComponent.ComponentLifeCycle
 * Low Row: ReactComponent.CompositeLifeCycle
 *
 * +-------+------------------------------------------------------+--------+
 * |  UN   |                    MOUNTED                           |   UN   |
 * |MOUNTED|                                                      | MOUNTED|
 * +-------+------------------------------------------------------+--------+
 * |       ^--------+   +------+   +------+   +------+   +--------^        |
 * |       |        |   |      |   |      |   |      |   |        |        |
 * |    0--|MOUNTING|-0-|RECEIV|-0-|RECEIV|-0-|RECEIV|-0-|   UN   |--->0   |
 * |       |        |   |PROPS |   | PROPS|   | STATE|   |MOUNTING|        |
 * |       |        |   |      |   |      |   |      |   |        |        |
 * |       |        |   |      |   |      |   |      |   |        |        |
 * |       +--------+   +------+   +------+   +------+   +--------+        |
 * |       |                                                      |        |
 * +-------+------------------------------------------------------+--------+
 */
var CompositeLifeCycle = keyMirror({
  /**
   * Components in the process of being mounted respond to state changes
   * differently.
   */
  MOUNTING: null,
  /**
   * Components in the process of being unmounted are guarded against state
   * changes.
   */
  UNMOUNTING: null,
  /**
   * Components that are mounted and receiving new props respond to state
   * changes differently.
   */
  RECEIVING_PROPS: null,
  /**
   * Components that are mounted and receiving new state are guarded against
   * additional state changes.
   */
  RECEIVING_STATE: null
});

/**
 * @lends {ReactCompositeComponent.prototype}
 */
var ReactCompositeComponentMixin = {

  /**
   * Base constructor for all composite component.
   *
   * @param {?object} initialProps
   * @param {*} children
   * @final
   * @internal
   */
  construct: function(initialProps, children) {
    // Children can be either an array or more than one argument
    ReactComponent.Mixin.construct.apply(this, arguments);
    this.state = null;
    this._pendingState = null;
    this._compositeLifeCycleState = null;
  },

  /**
   * Checks whether or not this composite component is mounted.
   * @return {boolean} True if mounted, false otherwise.
   * @protected
   * @final
   */
  isMounted: function() {
    return ReactComponent.Mixin.isMounted.call(this) &&
      this._compositeLifeCycleState !== CompositeLifeCycle.MOUNTING;
  },

  /**
   * Initializes the component, renders markup, and registers event listeners.
   *
   * @param {string} rootID DOM ID of the root node.
   * @param {ReactReconcileTransaction} transaction
   * @return {?string} Rendered markup to be inserted into the DOM.
   * @final
   * @internal
   */
  mountComponent: ReactPerf.measure(
    'ReactCompositeComponent',
    'mountComponent',
    function(rootID, transaction) {
      ReactComponent.Mixin.mountComponent.call(this, rootID, transaction);
      this._compositeLifeCycleState = CompositeLifeCycle.MOUNTING;

      this._defaultProps = this.getDefaultProps ? this.getDefaultProps() : null;
      this._processProps(this.props);

      if (this.__reactAutoBindMap) {
        this._bindAutoBindMethods();
      }

      this.state = this.getInitialState ? this.getInitialState() : null;
      this._pendingState = null;
      this._pendingForceUpdate = false;

      if (this.componentWillMount) {
        this.componentWillMount();
        // When mounting, calls to `setState` by `componentWillMount` will set
        // `this._pendingState` without triggering a re-render.
        if (this._pendingState) {
          this.state = this._pendingState;
          this._pendingState = null;
        }
      }

      this._renderedComponent = this._renderValidatedComponent();

      // Done with mounting, `setState` will now trigger UI changes.
      this._compositeLifeCycleState = null;
      var markup = this._renderedComponent.mountComponent(rootID, transaction);
      if (this.componentDidMount) {
        transaction.getReactOnDOMReady().enqueue(this, this.componentDidMount);
      }
      return markup;
    }
  ),

  /**
   * Releases any resources allocated by `mountComponent`.
   *
   * @final
   * @internal
   */
  unmountComponent: function() {
    this._compositeLifeCycleState = CompositeLifeCycle.UNMOUNTING;
    if (this.componentWillUnmount) {
      this.componentWillUnmount();
    }
    this._compositeLifeCycleState = null;

    this._defaultProps = null;

    ReactComponent.Mixin.unmountComponent.call(this);
    this._renderedComponent.unmountComponent();
    this._renderedComponent = null;

    if (this.refs) {
      this.refs = null;
    }

    // Some existing components rely on this.props even after they've been
    // destroyed (in event handlers).
    // TODO: this.props = null;
    // TODO: this.state = null;
  },

  /**
   * Sets a subset of the state. Always use this or `replaceState` to mutate
   * state. You should treat `this.state` as immutable.
   *
   * There is no guarantee that `this.state` will be immediately updated, so
   * accessing `this.state` after calling this method may return the old value.
   *
   * There is no guarantee that calls to `setState` will run synchronously,
   * as they may eventually be batched together.  You can provide an optional
   * callback that will be executed when the call to setState is actually
   * completed.
   *
   * @param {object} partialState Next partial state to be merged with state.
   * @param {?function} callback Called after state is updated.
   * @final
   * @protected
   */
  setState: function(partialState, callback) {
    // Merge with `_pendingState` if it exists, otherwise with existing state.
    this.replaceState(
      merge(this._pendingState || this.state, partialState),
      callback
    );
  },

  /**
   * Replaces all of the state. Always use this or `setState` to mutate state.
   * You should treat `this.state` as immutable.
   *
   * There is no guarantee that `this.state` will be immediately updated, so
   * accessing `this.state` after calling this method may return the old value.
   *
   * @param {object} completeState Next state.
   * @param {?function} callback Called after state is updated.
   * @final
   * @protected
   */
  replaceState: function(completeState, callback) {
    validateLifeCycleOnReplaceState(this);
    this._pendingState = completeState;
    ReactUpdates.enqueueUpdate(this, callback);
  },

  /**
   * Processes props by setting default values for unspecified props and
   * asserting that the props are valid.
   *
   * @param {object} props
   * @private
   */
  _processProps: function(props) {
    var propName;
    var defaultProps = this._defaultProps;
    for (propName in defaultProps) {
      if (!(propName in props)) {
        props[propName] = defaultProps[propName];
      }
    }
    var propTypes = this.constructor.propTypes;
    if (propTypes) {
      var componentName = this.constructor.displayName;
      for (propName in propTypes) {
        var checkProp = propTypes[propName];
        if (checkProp) {
          checkProp(props, propName, componentName);
        }
      }
    }
  },

  performUpdateIfNecessary: function() {
    var compositeLifeCycleState = this._compositeLifeCycleState;
    // Do not trigger a state transition if we are in the middle of mounting or
    // receiving props because both of those will already be doing this.
    if (compositeLifeCycleState === CompositeLifeCycle.MOUNTING ||
        compositeLifeCycleState === CompositeLifeCycle.RECEIVING_PROPS) {
      return;
    }
    ReactComponent.Mixin.performUpdateIfNecessary.call(this);
  },

  /**
   * If any of `_pendingProps`, `_pendingState`, or `_pendingForceUpdate` is
   * set, update the component.
   *
   * @param {ReactReconcileTransaction} transaction
   * @internal
   */
  _performUpdateIfNecessary: function(transaction) {
    if (this._pendingProps == null &&
        this._pendingState == null &&
        !this._pendingForceUpdate) {
      return;
    }

    var nextProps = this.props;
    if (this._pendingProps != null) {
      nextProps = this._pendingProps;
      this._processProps(nextProps);
      this._pendingProps = null;

      this._compositeLifeCycleState = CompositeLifeCycle.RECEIVING_PROPS;
      if (this.componentWillReceiveProps) {
        this.componentWillReceiveProps(nextProps, transaction);
      }
    }

    this._compositeLifeCycleState = CompositeLifeCycle.RECEIVING_STATE;

    var nextState = this._pendingState || this.state;
    this._pendingState = null;

    if (this._pendingForceUpdate ||
        !this.shouldComponentUpdate ||
        this.shouldComponentUpdate(nextProps, nextState)) {
      this._pendingForceUpdate = false;
      // Will set `this.props` and `this.state`.
      this._performComponentUpdate(nextProps, nextState, transaction);
    } else {
      // If it's determined that a component should not update, we still want
      // to set props and state.
      this.props = nextProps;
      this.state = nextState;
    }

    this._compositeLifeCycleState = null;
  },

  /**
   * Merges new props and state, notifies delegate methods of update and
   * performs update.
   *
   * @param {object} nextProps Next object to set as properties.
   * @param {?object} nextState Next object to set as state.
   * @param {ReactReconcileTransaction} transaction
   * @private
   */
  _performComponentUpdate: function(nextProps, nextState, transaction) {
    var prevProps = this.props;
    var prevState = this.state;

    if (this.componentWillUpdate) {
      this.componentWillUpdate(nextProps, nextState, transaction);
    }

    this.props = nextProps;
    this.state = nextState;

    this.updateComponent(transaction, prevProps, prevState);

    if (this.componentDidUpdate) {
      transaction.getReactOnDOMReady().enqueue(
        this,
        this.componentDidUpdate.bind(this, prevProps, prevState)
      );
    }
  },

  /**
   * Updates the component's currently mounted DOM representation.
   *
   * By default, this implements React's rendering and reconciliation algorithm.
   * Sophisticated clients may wish to override this.
   *
   * @param {ReactReconcileTransaction} transaction
   * @param {object} prevProps
   * @param {?object} prevState
   * @internal
   * @overridable
   */
  updateComponent: ReactPerf.measure(
    'ReactCompositeComponent',
    'updateComponent',
    function(transaction, prevProps, prevState) {
      ReactComponent.Mixin.updateComponent.call(this, transaction, prevProps);
      var currentComponent = this._renderedComponent;
      var nextComponent = this._renderValidatedComponent();
      if (currentComponent.constructor === nextComponent.constructor) {
        currentComponent.receiveProps(nextComponent.props, transaction);
      } else {
        // These two IDs are actually the same! But nothing should rely on that.
        var thisID = this._rootNodeID;
        var currentComponentID = currentComponent._rootNodeID;
        currentComponent.unmountComponent();
        var nextMarkup = nextComponent.mountComponent(thisID, transaction);
        ReactComponent.DOMIDOperations.dangerouslyReplaceNodeWithMarkupByID(
          currentComponentID,
          nextMarkup
        );
        this._renderedComponent = nextComponent;
      }
    }
  ),

  /**
   * Forces an update. This should only be invoked when it is known with
   * certainty that we are **not** in a DOM transaction.
   *
   * You may want to call this when you know that some deeper aspect of the
   * component's state has changed but `setState` was not called.
   *
   * This will not invoke `shouldUpdateComponent`, but it will invoke
   * `componentWillUpdate` and `componentDidUpdate`.
   *
   * @param {?function} callback Called after update is complete.
   * @final
   * @protected
   */
  forceUpdate: function(callback) {
    var compositeLifeCycleState = this._compositeLifeCycleState;
    invariant(this.isMounted() ||
      compositeLifeCycleState === CompositeLifeCycle.MOUNTING);
    invariant(compositeLifeCycleState !== CompositeLifeCycle.RECEIVING_STATE &&
    compositeLifeCycleState !== CompositeLifeCycle.UNMOUNTING);
    this._pendingForceUpdate = true;
    ReactUpdates.enqueueUpdate(this, callback);
  },

  /**
   * @private
   */
  _renderValidatedComponent: function() {
    var renderedComponent;
    ReactCurrentOwner.current = this;
    try {
      renderedComponent = this.render();
    } catch (error) {
      // IE8 requires `catch` in order to use `finally`.
      throw error;
    } finally {
      ReactCurrentOwner.current = null;
    }
    invariant(ReactComponent.isValidComponent(renderedComponent));
    return renderedComponent;
  },

  /**
   * @private
   */
  _bindAutoBindMethods: function() {
    for (var autoBindKey in this.__reactAutoBindMap) {
      if (!this.__reactAutoBindMap.hasOwnProperty(autoBindKey)) {
        continue;
      }
      var method = this.__reactAutoBindMap[autoBindKey];
      this[autoBindKey] = this._bindAutoBindMethod(method);
    }
  },

  /**
   * Binds a method to the component.
   *
   * @param {function} method Method to be bound.
   * @private
   */
  _bindAutoBindMethod: function(method) {
      var component = this;

      var boundMethod = function() {
        return method.apply(component, arguments);
      };

      return boundMethod;
  }
};

var ReactCompositeComponentBase = function() {};
mixInto(ReactCompositeComponentBase, ReactComponent.Mixin);
mixInto(ReactCompositeComponentBase, ReactOwner.Mixin);
mixInto(ReactCompositeComponentBase, ReactPropTransferer.Mixin);
mixInto(ReactCompositeComponentBase, ReactCompositeComponentMixin);

/**
 * Module for creating composite components.
 *
 * @class ReactCompositeComponent
 * @extends ReactComponent
 * @extends ReactOwner
 * @extends ReactPropTransferer
 */
var ReactCompositeComponent = {

  LifeCycle: CompositeLifeCycle,

  Base: ReactCompositeComponentBase,

  /**
   * Creates a composite component class given a class specification.
   *
   * @param {object} spec Class specification (which must define `render`).
   * @return {function} Component constructor function.
   * @public
   */
  createClass: function(spec) {
    var Constructor = function() {};
    Constructor.prototype = new ReactCompositeComponentBase();
    Constructor.prototype.constructor = Constructor;
    mixSpecIntoComponent(Constructor, spec);
    invariant(Constructor.prototype.render);
    // Reduce time spent doing lookups by setting these on the prototype.
    for (var methodName in ReactCompositeComponentInterface) {
      if (!Constructor.prototype[methodName]) {
        Constructor.prototype[methodName] = null;
      }
    }

    var ConvenienceConstructor = function(props, children) {
      var instance = new Constructor();
      instance.construct.apply(instance, arguments);
      return instance;
    };
    ConvenienceConstructor.componentConstructor = Constructor;
    ConvenienceConstructor.originalSpec = spec;
    return ConvenienceConstructor;
  },

  /**
   * Checks if a value is a valid component constructor.
   *
   * @param {*}
   * @return {boolean}
   * @public
   */
  isValidClass: function(componentClass) {
    return componentClass instanceof Function &&
           'componentConstructor' in componentClass &&
           componentClass.componentConstructor instanceof Function;
  },

  /**
   * TODO: Delete this when all callers have been updated to rely on this
   * behavior being the default.
   *
   * Backwards compatible stub for what is now the default behavior.
   * @param {function} method Method to be bound.
   * @public
   */
  autoBind: function(method) {
      return method;
  }
};

module.exports = ReactCompositeComponent;

},{"./ReactComponent":"RDDX+O","./ReactCurrentOwner":"j7aNlU","./ReactOwner":"YwelYh","./ReactPerf":"S6hUyz","./ReactPropTransferer":"K6UoEF","./ReactUpdates":"dwYRw4","./invariant":"hPxNWC","./keyMirror":"n1FgJb","./merge":"7duoWY","./mixInto":"qzQld6","./objMap":"XYM/FC"}],"j7aNlU":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactCurrentOwner
 */

"use strict";

/**
 * Keeps track of the current owner.
 *
 * The current owner is the component who should own any components that are
 * currently being constructed.
 *
 * The depth indicate how many composite components are above this render level.
 */
var ReactCurrentOwner = {

  /**
   * @internal
   * @type {ReactComponent}
   */
  current: null

};

module.exports = ReactCurrentOwner;

},{}],"6GzACJ":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactDOM
 * @typechecks static-only
 */

"use strict";

var ReactNativeComponent = require("./ReactNativeComponent");

var mergeInto = require("./mergeInto");
var objMapKeyVal = require("./objMapKeyVal");

/**
 * Creates a new React class that is idempotent and capable of containing other
 * React components. It accepts event listeners and DOM properties that are
 * valid according to `DOMProperty`.
 *
 *  - Event listeners: `onClick`, `onMouseDown`, etc.
 *  - DOM properties: `className`, `name`, `title`, etc.
 *
 * The `style` property functions differently from the DOM API. It accepts an
 * object mapping of style properties to values.
 *
 * @param {string} tag Tag name (e.g. `div`).
 * @param {boolean} omitClose True if the close tag should be omitted.
 * @private
 */
function createDOMComponentClass(tag, omitClose) {
  var Constructor = function() {};
  Constructor.prototype = new ReactNativeComponent(tag, omitClose);
  Constructor.prototype.constructor = Constructor;

  var ConvenienceConstructor = function(props, children) {
    var instance = new Constructor();
    instance.construct.apply(instance, arguments);
    return instance;
  };
  ConvenienceConstructor.componentConstructor = Constructor;
  return ConvenienceConstructor;
}

/**
 * Creates a mapping from supported HTML tags to `ReactNativeComponent` classes.
 * This is also accessible via `React.DOM`.
 *
 * @public
 */
var ReactDOM = objMapKeyVal({
  a: false,
  abbr: false,
  address: false,
  area: false,
  article: false,
  aside: false,
  audio: false,
  b: false,
  base: false,
  bdi: false,
  bdo: false,
  big: false,
  blockquote: false,
  body: false,
  br: true,
  button: false,
  canvas: false,
  caption: false,
  cite: false,
  code: false,
  col: true,
  colgroup: false,
  data: false,
  datalist: false,
  dd: false,
  del: false,
  details: false,
  dfn: false,
  div: false,
  dl: false,
  dt: false,
  em: false,
  embed: true,
  fieldset: false,
  figcaption: false,
  figure: false,
  footer: false,
  form: false, // NOTE: Injected, see `ReactDOMForm`.
  h1: false,
  h2: false,
  h3: false,
  h4: false,
  h5: false,
  h6: false,
  head: false,
  header: false,
  hr: true,
  html: false,
  i: false,
  iframe: false,
  img: true,
  input: true,
  ins: false,
  kbd: false,
  keygen: true,
  label: false,
  legend: false,
  li: false,
  link: false,
  main: false,
  map: false,
  mark: false,
  menu: false,
  menuitem: false, // NOTE: Close tag should be omitted, but causes problems.
  meta: true,
  meter: false,
  nav: false,
  noscript: false,
  object: false,
  ol: false,
  optgroup: false,
  option: false,
  output: false,
  p: false,
  param: true,
  pre: false,
  progress: false,
  q: false,
  rp: false,
  rt: false,
  ruby: false,
  s: false,
  samp: false,
  script: false,
  section: false,
  select: false,
  small: false,
  source: false,
  span: false,
  strong: false,
  style: false,
  sub: false,
  summary: false,
  sup: false,
  table: false,
  tbody: false,
  td: false,
  textarea: false, // NOTE: Injected, see `ReactDOMTextarea`.
  tfoot: false,
  th: false,
  thead: false,
  time: false,
  title: false,
  tr: false,
  track: true,
  u: false,
  ul: false,
  'var': false,
  video: false,
  wbr: false,

  // SVG
  circle: false,
  g: false,
  line: false,
  path: false,
  polyline: false,
  rect: false,
  svg: false,
  text: false
}, createDOMComponentClass);

var injection = {
  injectComponentClasses: function(componentClasses) {
    mergeInto(ReactDOM, componentClasses);
  }
};

ReactDOM.injection = injection;

module.exports = ReactDOM;

},{"./ReactNativeComponent":"g13zJS","./mergeInto":"1Kx0L6","./objMapKeyVal":"863Jz9"}],"0sS+Uk":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactDOMButton
 */

"use strict";

var ReactCompositeComponent = require("./ReactCompositeComponent");
var ReactDOM = require("./ReactDOM");

var keyMirror = require("./keyMirror");

// Store a reference to the <button> `ReactNativeComponent`.
var button = ReactDOM.button;

var mouseListenerNames = keyMirror({
  onClick: true,
  onDoubleClick: true,
  onMouseDown: true,
  onMouseMove: true,
  onMouseUp: true,
  onClickCapture: true,
  onDoubleClickCapture: true,
  onMouseDownCapture: true,
  onMouseMoveCapture: true,
  onMouseUpCapture: true
});

/**
 * Implements a <button> native component that does not receive mouse events
 * when `disabled` is set.
 */
var ReactDOMButton = ReactCompositeComponent.createClass({

  render: function() {
    var props = {};

    // Copy the props; except the mouse listeners if we're disabled
    for (var key in this.props) {
      if (this.props.hasOwnProperty(key) &&
          (!this.props.disabled || !mouseListenerNames[key])) {
        props[key] = this.props[key];
      }
    }

    return button(props, this.props.children);
  }

});

module.exports = ReactDOMButton;

},{"./ReactCompositeComponent":"nAvIQF","./ReactDOM":"6GzACJ","./keyMirror":"n1FgJb"}],"2ZgJdE":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactDOMForm
 */

"use strict";

var ReactCompositeComponent = require("./ReactCompositeComponent");
var ReactDOM = require("./ReactDOM");
var ReactEventEmitter = require("./ReactEventEmitter");
var EventConstants = require("./EventConstants");

// Store a reference to the <form> `ReactNativeComponent`.
var form = ReactDOM.form;

/**
 * Since onSubmit doesn't bubble OR capture on the top level in IE8, we need
 * to capture it on the <form> element itself. There are lots of hacks we could
 * do to accomplish this, but the most reliable is to make <form> a
 * composite component and use `componentDidMount` to attach the event handlers.
 */
var ReactDOMForm = ReactCompositeComponent.createClass({
  render: function() {
    // TODO: Instead of using `ReactDOM` directly, we should use JSX. However,
    // `jshint` fails to parse JSX so in order for linting to work in the open
    // source repo, we need to just use `ReactDOM.form`.
    return this.transferPropsTo(form(null, this.props.children));
  },

  componentDidMount: function(node) {
    ReactEventEmitter.trapBubbledEvent(
      EventConstants.topLevelTypes.topSubmit,
      'submit',
      node
    );
  }
});

module.exports = ReactDOMForm;

},{"./EventConstants":"Gaqr6V","./ReactCompositeComponent":"nAvIQF","./ReactDOM":"6GzACJ","./ReactEventEmitter":"qPIJ8M"}],"nRDvnf":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactDOMIDOperations
 * @typechecks static-only
 */

/*jslint evil: true */

"use strict";

var CSSPropertyOperations = require("./CSSPropertyOperations");
var DOMChildrenOperations = require("./DOMChildrenOperations");
var DOMPropertyOperations = require("./DOMPropertyOperations");
var ReactMount = require("./ReactMount");

var getTextContentAccessor = require("./getTextContentAccessor");
var invariant = require("./invariant");

/**
 * Errors for properties that should not be updated with `updatePropertyById()`.
 *
 * @type {object}
 * @private
 */
var INVALID_PROPERTY_ERRORS = {
  dangerouslySetInnerHTML:
    '`dangerouslySetInnerHTML` must be set using `updateInnerHTMLByID()`.',
  style: '`style` must be set using `updateStylesByID()`.'
};

/**
 * The DOM property to use when setting text content.
 *
 * @type {string}
 * @private
 */
var textContentAccessor = getTextContentAccessor() || 'NA';

/**
 * Operations used to process updates to DOM nodes. This is made injectable via
 * `ReactComponent.DOMIDOperations`.
 */
var ReactDOMIDOperations = {

  /**
   * Updates a DOM node with new property values. This should only be used to
   * update DOM properties in `DOMProperty`.
   *
   * @param {string} id ID of the node to update.
   * @param {string} name A valid property name, see `DOMProperty`.
   * @param {*} value New value of the property.
   * @internal
   */
  updatePropertyByID: function(id, name, value) {
    var node = ReactMount.getNode(id);
    invariant(!INVALID_PROPERTY_ERRORS.hasOwnProperty(name));

    // If we're updating to null or undefined, we should remove the property
    // from the DOM node instead of inadvertantly setting to a string. This
    // brings us in line with the same behavior we have on initial render.
    if (value != null) {
      DOMPropertyOperations.setValueForProperty(node, name, value);
    } else {
      DOMPropertyOperations.deleteValueForProperty(node, name);
    }
  },

  /**
   * Updates a DOM node to remove a property. This should only be used to remove
   * DOM properties in `DOMProperty`.
   *
   * @param {string} id ID of the node to update.
   * @param {string} name A property name to remove, see `DOMProperty`.
   * @internal
   */
  deletePropertyByID: function(id, name, value) {
    var node = ReactMount.getNode(id);
    invariant(!INVALID_PROPERTY_ERRORS.hasOwnProperty(name));
    DOMPropertyOperations.deleteValueForProperty(node, name, value);
  },

  /**
   * This should almost never be used instead of `updatePropertyByID()` due to
   * the extra object allocation required by the API. That said, this is useful
   * for batching up several operations across worker thread boundaries.
   *
   * @param {string} id ID of the node to update.
   * @param {object} properties A mapping of valid property names.
   * @internal
   * @see {ReactDOMIDOperations.updatePropertyByID}
   */
  updatePropertiesByID: function(id, properties) {
    for (var name in properties) {
      if (!properties.hasOwnProperty(name)) {
        continue;
      }
      ReactDOMIDOperations.updatePropertiesByID(id, name, properties[name]);
    }
  },

  /**
   * Updates a DOM node with new style values. If a value is specified as '',
   * the corresponding style property will be unset.
   *
   * @param {string} id ID of the node to update.
   * @param {object} styles Mapping from styles to values.
   * @internal
   */
  updateStylesByID: function(id, styles) {
    var node = ReactMount.getNode(id);
    CSSPropertyOperations.setValueForStyles(node, styles);
  },

  /**
   * Updates a DOM node's innerHTML set by `props.dangerouslySetInnerHTML`.
   *
   * @param {string} id ID of the node to update.
   * @param {object} html An HTML object with the `__html` property.
   * @internal
   */
  updateInnerHTMLByID: function(id, html) {
    var node = ReactMount.getNode(id);
    // HACK: IE8- normalize whitespace in innerHTML, removing leading spaces.
    // @see quirksmode.org/bugreports/archives/2004/11/innerhtml_and_t.html
    node.innerHTML = (html && html.__html || '').replace(/^ /g, '&nbsp;');
  },

  /**
   * Updates a DOM node's text content set by `props.content`.
   *
   * @param {string} id ID of the node to update.
   * @param {string} content Text content.
   * @internal
   */
  updateTextContentByID: function(id, content) {
    var node = ReactMount.getNode(id);
    node[textContentAccessor] = content;
  },

  /**
   * Replaces a DOM node that exists in the document with markup.
   *
   * @param {string} id ID of child to be replaced.
   * @param {string} markup Dangerous markup to inject in place of child.
   * @internal
   * @see {Danger.dangerouslyReplaceNodeWithMarkup}
   */
  dangerouslyReplaceNodeWithMarkupByID: function(id, markup) {
    var node = ReactMount.getNode(id);
    DOMChildrenOperations.dangerouslyReplaceNodeWithMarkup(node, markup);
  },

  /**
   * Updates a component's children by processing a series of updates.
   *
   * @param {array<object>} updates List of update configurations.
   * @param {array<string>} markup List of markup strings.
   * @internal
   */
  dangerouslyProcessChildrenUpdates: function(updates, markup) {
    for (var i = 0; i < updates.length; i++) {
      updates[i].parentNode = ReactMount.getNode(updates[i].parentID);
    }
    DOMChildrenOperations.processUpdates(updates, markup);
  }

};

module.exports = ReactDOMIDOperations;

},{"./CSSPropertyOperations":"BlPn6+","./DOMChildrenOperations":"a0oMnh","./DOMPropertyOperations":"n+MrOf","./ReactMount":"1R+7Eu","./getTextContentAccessor":"Suh93r","./invariant":"hPxNWC"}],"e8EEBl":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactDOMInput
 */

"use strict";

var DOMPropertyOperations = require("./DOMPropertyOperations");
var ReactCompositeComponent = require("./ReactCompositeComponent");
var ReactDOM = require("./ReactDOM");

var merge = require("./merge");

// Store a reference to the <input> `ReactNativeComponent`.
var input = ReactDOM.input;

/**
 * Implements an <input> native component that allows setting these optional
 * props: `checked`, `value`, `defaultChecked`, and `defaultValue`.
 *
 * If `checked` or `value` are not supplied (or null/undefined), user actions
 * that affect the checked state or value will trigger updates to the element.
 *
 * If they are supplied (and not null/undefined), the rendered element will not
 * trigger updates to the element. Instead, the props must change in order for
 * the rendered element to be updated.
 *
 * The rendered element will be initialized as unchecked (or `defaultChecked`)
 * with an empty value (or `defaultValue`).
 *
 * @see http://www.w3.org/TR/2012/WD-html5-20121025/the-input-element.html
 */
var ReactDOMInput = ReactCompositeComponent.createClass({

  getInitialState: function() {
    return {
      checked: this.props.defaultChecked || false,
      value: this.props.defaultValue != null ? this.props.defaultValue : ''
    };
  },

  shouldComponentUpdate: function() {
    // Defer any updates to this component during the `onChange` handler.
    return !this._isChanging;
  },

  render: function() {
    // Clone `this.props` so we don't mutate the input.
    var props = merge(this.props);

    props.checked =
      this.props.checked != null ? this.props.checked : this.state.checked;
    // Cast `this.props.value` to a string so equality checks pass.
    props.value =
      this.props.value != null ? '' + this.props.value : this.state.value;
    props.onChange = this._handleChange;

    return input(props, this.props.children);
  },

  componentDidUpdate: function(prevProps, prevState, rootNode) {
    if (this.props.checked != null) {
      DOMPropertyOperations.setValueForProperty(
        rootNode,
        'checked',
        this.props.checked || false
      );
    }
    if (this.props.value != null) {
      // Cast `this.props.value` to a string so falsey values that cast to
      // truthy strings are not ignored.
      DOMPropertyOperations.setValueForProperty(
        rootNode,
        'value',
        '' + this.props.value || ''
      );
    }
  },

  _handleChange: function(event) {
    var returnValue;
    if (this.props.onChange) {
      this._isChanging = true;
      returnValue = this.props.onChange(event);
      this._isChanging = false;
    }
    this.setState({
      checked: event.target.checked,
      value: event.target.value
    });
    return returnValue;
  }

});

module.exports = ReactDOMInput;

},{"./DOMPropertyOperations":"n+MrOf","./ReactCompositeComponent":"nAvIQF","./ReactDOM":"6GzACJ","./merge":"7duoWY"}],"Kfaqkr":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactDOMOption
 */

"use strict";

var ReactCompositeComponent = require("./ReactCompositeComponent");
var ReactDOM = require("./ReactDOM");

// Store a reference to the <option> `ReactNativeComponent`.
var option = ReactDOM.option;

/**
 * Implements an <option> native component that warns when `selected` is set.
 */
var ReactDOMOption = ReactCompositeComponent.createClass({

  componentWillMount: function() {
    // TODO (yungsters): Remove support for `selected` in <option>.
    if (this.props.selected != null) {}
  },

  render: function() {
    return option(this.props, this.props.children);
  }

});

module.exports = ReactDOMOption;

},{"./ReactCompositeComponent":"nAvIQF","./ReactDOM":"6GzACJ"}],"gA/to5":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactDOMSelect
 */

"use strict";

var ReactCompositeComponent = require("./ReactCompositeComponent");
var ReactDOM = require("./ReactDOM");

var invariant = require("./invariant");
var merge = require("./merge");

// Store a reference to the <select> `ReactNativeComponent`.
var select = ReactDOM.select;

/**
 * Validation function for `value` and `defaultValue`.
 * @private
 */
function selectValueType(props, propName, componentName) {
  if (props[propName] == null) {
    return;
  }
  if (props.multiple) {
    invariant(Array.isArray(props[propName]));
  } else {
    invariant(!Array.isArray(props[propName]));
  }
}

/**
 * If `value` is supplied, updates <option> elements on mount and update.
 * @private
 */
function updateOptions() {
  /*jshint validthis:true */
  var value = this.props.value != null ? this.props.value : this.state.value;
  var options = this.getDOMNode().options;
  var selectedValue = '' + value;

  for (var i = 0, l = options.length; i < l; i++) {
    var selected = this.props.multiple ?
      selectedValue.indexOf(options[i].value) >= 0 :
      selected = options[i].value === selectedValue;

    if (selected !== options[i].selected) {
      options[i].selected = selected;
    }
  }
}

/**
 * Implements a <select> native component that allows optionally setting the
 * props `value` and `defaultValue`. If `multiple` is false, the prop must be a
 * string. If `multiple` is true, the prop must be an array of strings.
 *
 * If `value` is not supplied (or null/undefined), user actions that change the
 * selected option will trigger updates to the rendered options.
 *
 * If it is supplied (and not null/undefined), the rendered options will not
 * update in response to user actions. Instead, the `value` prop must change in
 * order for the rendered options to update.
 *
 * If `defaultValue` is provided, any options with the supplied values will be
 * selected.
 */
var ReactDOMSelect = ReactCompositeComponent.createClass({

  propTypes: {
    defaultValue: selectValueType,
    value: selectValueType
  },

  getInitialState: function() {
    return {value: this.props.defaultValue || (this.props.multiple ? [] : '')};
  },

  componentWillReceiveProps: function(nextProps) {
    if (!this.props.multiple && nextProps.multiple) {
      this.setState({value: [this.state.value]});
    } else if (this.props.multiple && !nextProps.multiple) {
      this.setState({value: this.state.value[0]});
    }
  },

  shouldComponentUpdate: function() {
    // Defer any updates to this component during the `onChange` handler.
    return !this._isChanging;
  },

  render: function() {
    // Clone `this.props` so we don't mutate the input.
    var props = merge(this.props);

    props.onChange = this._handleChange;
    props.value = null;

    return select(props, this.props.children);
  },

  componentDidMount: updateOptions,

  componentDidUpdate: updateOptions,

  _handleChange: function(event) {
    var returnValue;
    if (this.props.onChange) {
      this._isChanging = true;
      returnValue = this.props.onChange(event);
      this._isChanging = false;
    }

    var selectedValue;
    if (this.props.multiple) {
      selectedValue = [];
      var options = event.target.options;
      for (var i = 0, l = options.length; i < l; i++) {
        if (options[i].selected) {
          selectedValue.push(options[i].value);
        }
      }
    } else {
      selectedValue = event.target.value;
    }

    this.setState({value: selectedValue});
    return returnValue;
  }

});

module.exports = ReactDOMSelect;

},{"./ReactCompositeComponent":"nAvIQF","./ReactDOM":"6GzACJ","./invariant":"hPxNWC","./merge":"7duoWY"}],"omUt5u":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactDOMTextarea
 */

"use strict";

var DOMPropertyOperations = require("./DOMPropertyOperations");
var ReactCompositeComponent = require("./ReactCompositeComponent");
var ReactDOM = require("./ReactDOM");

var invariant = require("./invariant");
var merge = require("./merge");

// Store a reference to the <textarea> `ReactNativeComponent`.
var textarea = ReactDOM.textarea;

// For quickly matching children type, to test if can be treated as content.
var CONTENT_TYPES = {'string': true, 'number': true};

/**
 * Implements a <textarea> native component that allows setting `value`, and
 * `defaultValue`. This differs from the traditional DOM API because value is
 * usually set as PCDATA children.
 *
 * If `value` is not supplied (or null/undefined), user actions that affect the
 * value will trigger updates to the element.
 *
 * If `value` is supplied (and not null/undefined), the rendered element will
 * not trigger updates to the element. Instead, the `value` prop must change in
 * order for the rendered element to be updated.
 *
 * The rendered element will be initialized with an empty value, the prop
 * `defaultValue` if specified, or the children content (deprecated).
 */
var ReactDOMTextarea = ReactCompositeComponent.createClass({

  getInitialState: function() {
    var defaultValue = this.props.defaultValue;
    // TODO (yungsters): Remove support for children content in <textarea>.
    var children = this.props.children;
    if (children != null) {
        invariant(defaultValue == null);

        if (Array.isArray(children)) {
          invariant(children.length <= 1);
          children = children[0];
        }

        invariant(CONTENT_TYPES[typeof children]);
        defaultValue = '' + children;
    }
    if (defaultValue == null) {
      defaultValue = '';
    }
    return {
      // We save the initial value so that `ReactNativeComponent` doesn't update
      // `textContent` (unnecessary since we update value).
      initialValue: this.props.value != null ? this.props.value : defaultValue,
      value: defaultValue
    };
  },

  shouldComponentUpdate: function() {
    // Defer any updates to this component during the `onChange` handler.
    return !this._isChanging;
  },

  render: function() {
    // Clone `this.props` so we don't mutate the input.
    var props = merge(this.props);

    invariant(props.dangerouslySetInnerHTML == null);

    props.value =
      this.props.value != null ? this.props.value : this.state.value;
    props.onChange = this._handleChange;

    // Always set children to the same thing. In IE9, the selection range will
    // get reset if `textContent` is mutated.
    return textarea(props, this.state.initialValue);
  },

  componentDidUpdate: function(prevProps, prevState, rootNode) {
    if (this.props.value != null) {
      DOMPropertyOperations.setValueForProperty(
        rootNode,
        'value',
        this.props.value || ''
      );
    }
  },

  _handleChange: function(event) {
    var returnValue;
    if (this.props.onChange) {
      this._isChanging = true;
      returnValue = this.props.onChange(event);
      this._isChanging = false;
    }
    this.setState({value: event.target.value});
    return returnValue;
  }

});

module.exports = ReactDOMTextarea;

},{"./DOMPropertyOperations":"n+MrOf","./ReactCompositeComponent":"nAvIQF","./ReactDOM":"6GzACJ","./invariant":"hPxNWC","./merge":"7duoWY"}],"FN7wZd":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactDefaultBatchingStrategy
 */

"use strict";

var ReactUpdates = require("./ReactUpdates");
var Transaction = require("./Transaction");

var emptyFunction = require("./emptyFunction");
var mixInto = require("./mixInto");

var RESET_BATCHED_UPDATES = {
  initialize: emptyFunction,
  close: function() {
    ReactDefaultBatchingStrategy.isBatchingUpdates = false;
  }
};

var FLUSH_BATCHED_UPDATES = {
  initialize: emptyFunction,
  close: ReactUpdates.flushBatchedUpdates.bind(ReactUpdates)
};

var TRANSACTION_WRAPPERS = [FLUSH_BATCHED_UPDATES, RESET_BATCHED_UPDATES];

function ReactDefaultBatchingStrategyTransaction() {
  this.reinitializeTransaction();
}

mixInto(ReactDefaultBatchingStrategyTransaction, Transaction.Mixin);
mixInto(ReactDefaultBatchingStrategyTransaction, {
  getTransactionWrappers: function() {
    return TRANSACTION_WRAPPERS;
  }
});

var ReactDefaultBatchingStrategy = {
  isBatchingUpdates: false,

  /**
   * Call the provided function in a context within which calls to `setState`
   * and friends are batched such that components aren't updated unnecessarily.
   */
  batchedUpdates: function(callback) {
    var alreadyBatchingUpdates = ReactDefaultBatchingStrategy.isBatchingUpdates;

    ReactDefaultBatchingStrategy.isBatchingUpdates = true;

    // The code is written this way to avoid extra allocations
    if (alreadyBatchingUpdates) {
      callback();
    } else {
      var transaction = new ReactDefaultBatchingStrategyTransaction();
      transaction.perform(callback);
    }
  }
};

module.exports = ReactDefaultBatchingStrategy;

},{"./ReactUpdates":"dwYRw4","./Transaction":"aekoY0","./emptyFunction":"RxjlFd","./mixInto":"qzQld6"}],"oRxGN0":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactDefaultInjection
 */

"use strict";

var ReactDOM = require("./ReactDOM");
var ReactDOMButton = require("./ReactDOMButton");
var ReactDOMForm = require("./ReactDOMForm");
var ReactDOMInput = require("./ReactDOMInput");
var ReactDOMOption = require("./ReactDOMOption");
var ReactDOMSelect = require("./ReactDOMSelect");
var ReactDOMTextarea = require("./ReactDOMTextarea");
var ReactEventEmitter = require("./ReactEventEmitter");
var ReactEventTopLevelCallback = require("./ReactEventTopLevelCallback");
var ReactPerf = require("./ReactPerf");

var DefaultDOMPropertyConfig = require("./DefaultDOMPropertyConfig");
var DOMProperty = require("./DOMProperty");

var DefaultEventPluginOrder = require("./DefaultEventPluginOrder");
var EnterLeaveEventPlugin = require("./EnterLeaveEventPlugin");
var ChangeEventPlugin = require("./ChangeEventPlugin");
var EventPluginHub = require("./EventPluginHub");
var ReactInstanceHandles = require("./ReactInstanceHandles");
var SimpleEventPlugin = require("./SimpleEventPlugin");
var MobileSafariClickEventPlugin = require("./MobileSafariClickEventPlugin");

var ReactDefaultBatchingStrategy = require("./ReactDefaultBatchingStrategy");
var ReactUpdates = require("./ReactUpdates");

function inject() {
    ReactEventEmitter.TopLevelCallbackCreator = ReactEventTopLevelCallback;

    /**
     * Inject module for resolving DOM hierarchy and plugin ordering.
     */
    EventPluginHub.injection.injectEventPluginOrder(DefaultEventPluginOrder);

    EventPluginHub.injection.injectInstanceHandle(ReactInstanceHandles);

    /**
     * Some important event plugins included by default (without having to require
     * them).
     */
    EventPluginHub.injection.injectEventPluginsByName({
      'SimpleEventPlugin': SimpleEventPlugin,
      'EnterLeaveEventPlugin': EnterLeaveEventPlugin,
      'ChangeEventPlugin': ChangeEventPlugin,
      'MobileSafariClickEventPlugin': MobileSafariClickEventPlugin
    });

    ReactDOM.injection.injectComponentClasses({
      button: ReactDOMButton,
      form: ReactDOMForm,
      input: ReactDOMInput,
      option: ReactDOMOption,
      select: ReactDOMSelect,
      textarea: ReactDOMTextarea
    });

    DOMProperty.injection.injectDOMPropertyConfig(DefaultDOMPropertyConfig);

    ReactUpdates.injection.injectBatchingStrategy(
      ReactDefaultBatchingStrategy
    );
}

module.exports = {
  inject: inject
};

},{"./ChangeEventPlugin":"KJ8HU6","./DOMProperty":"fduHX3","./DefaultDOMPropertyConfig":"lojxFf","./DefaultEventPluginOrder":"rrDzGt","./EnterLeaveEventPlugin":"NAAuN8","./EventPluginHub":"EddLdT","./MobileSafariClickEventPlugin":"OHn5BI","./ReactDOM":"6GzACJ","./ReactDOMButton":"0sS+Uk","./ReactDOMForm":"2ZgJdE","./ReactDOMInput":"e8EEBl","./ReactDOMOption":"Kfaqkr","./ReactDOMSelect":"gA/to5","./ReactDOMTextarea":"omUt5u","./ReactDefaultBatchingStrategy":"FN7wZd","./ReactEventEmitter":"qPIJ8M","./ReactEventTopLevelCallback":"f4CWDK","./ReactInstanceHandles":"owd960","./ReactPerf":"S6hUyz","./ReactUpdates":"dwYRw4","./SimpleEventPlugin":"vsWsrL"}],"MTKS4R":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactDefaultPerf
 * @typechecks static-only
 */

"use strict";

var performanceNow = require("./performanceNow");

var ReactDefaultPerf = {};

if (true) {
  ReactDefaultPerf = {
    /**
     * Gets the stored information for a given object's function.
     *
     * @param {string} objName
     * @param {string} fnName
     * @return {?object}
     */
    getInfo: function(objName, fnName) {
      if (!this.info[objName] || !this.info[objName][fnName]) {
        return null;
      }
      return this.info[objName][fnName];
    },

    /**
     * Gets the logs pertaining to a given object's function.
     *
     * @param {string} objName
     * @param {string} fnName
     * @return {?array<object>}
     */
    getLogs: function(objName, fnName) {
      if (!this.getInfo(objName, fnName)) {
        return null;
      }
      return this.logs.filter(function(log) {
        return log.objName === objName && log.fnName === fnName;
      });
    },

    /**
     * Runs through the logs and builds an array of arrays, where each array
     * walks through the mounting/updating of each component underneath.
     *
     * @param {string} rootID The reactID of the root node, e.g. '.r[2cpyq]'
     * @return {array<array>}
     */
    getRawRenderHistory: function(rootID) {
      var history = [];
      /**
       * Since logs are added after the method returns, the logs are in a sense
       * upside-down: the inner-most elements from mounting/updating are logged
       * first, and the last addition to the log is the top renderComponent.
       * Therefore, we flip the logs upside down for ease of processing, and
       * reverse the history array at the end so the earliest event has index 0.
       */
      var logs = this.logs.filter(function(log) {
        return log.reactID.indexOf(rootID) === 0;
      }).reverse();

      var subHistory = [];
      logs.forEach(function(log, i) {
        if (i && log.reactID === rootID && logs[i - 1].reactID !== rootID) {
          subHistory.length && history.push(subHistory);
          subHistory = [];
        }
        subHistory.push(log);
      });
      if (subHistory.length) {
        history.push(subHistory);
      }
      return history.reverse();
    },

    /**
     * Runs through the logs and builds an array of strings, where each string
     * is a multiline formatted way of walking through the mounting/updating
     * underneath.
     *
     * @param {string} rootID The reactID of the root node, e.g. '.r[2cpyq]'
     * @return {array<string>}
     */
    getRenderHistory: function(rootID) {
      var history = this.getRawRenderHistory(rootID);

      return history.map(function(subHistory) {
        var headerString = (
          'log# Component (execution time) [bloat from logging]\n' +
          '================================================================\n'
        );
        return headerString + subHistory.map(function(log) {
          // Add two spaces for every layer in the reactID.
          var indents = '\t' + Array(log.reactID.split('.[').length).join('  ');
          var delta = _microTime(log.timing.delta);
          var bloat = _microTime(log.timing.timeToLog);

          return log.index + indents + log.name + ' (' + delta + 'ms)' +
            ' [' + bloat + 'ms]';
        }).join('\n');
      });
    },

    /**
     * Print the render history from `getRenderHistory` using console.log.
     * This is currently the best way to display perf data from
     * any React component; working on that.
     *
     * @param {string} rootID The reactID of the root node, e.g. '.r[2cpyq]'
     * @param {number} index
     */
    printRenderHistory: function(rootID, index) {
      var history = this.getRenderHistory(rootID);
      if (!history[index]) {
        console.warn(
          'Index', index, 'isn\'t available! ' +
          'The render history is', history.length, 'long.'
        );
        return;
      }
      console.log(
        'Loading render history #' + (index + 1) +
        ' of ' + history.length + ':\n' + history[index]
      );
    },

    /**
     * Prints the heatmap legend to console, showing how the colors correspond
     * with render times. This relies on console.log styles.
     */
    printHeatmapLegend: function() {
      if (!this.options.heatmap.enabled) {
        return;
      }
      var max = this.info.React
        && this.info.React.renderComponent
        && this.info.React.renderComponent.max;
      if (max) {
        var logStr = 'Heatmap: ';
        for (var ii = 0; ii <= 10 * max; ii += max) {
          logStr += '%c ' + (Math.round(ii) / 10) + 'ms ';
        }
        console.log(
          logStr,
          'background-color: hsla(100, 100%, 50%, 0.6);',
          'background-color: hsla( 90, 100%, 50%, 0.6);',
          'background-color: hsla( 80, 100%, 50%, 0.6);',
          'background-color: hsla( 70, 100%, 50%, 0.6);',
          'background-color: hsla( 60, 100%, 50%, 0.6);',
          'background-color: hsla( 50, 100%, 50%, 0.6);',
          'background-color: hsla( 40, 100%, 50%, 0.6);',
          'background-color: hsla( 30, 100%, 50%, 0.6);',
          'background-color: hsla( 20, 100%, 50%, 0.6);',
          'background-color: hsla( 10, 100%, 50%, 0.6);',
          'background-color: hsla(  0, 100%, 50%, 0.6);'
        );
      }
    },

    /**
     * Measure a given function with logging information, and calls a callback
     * if there is one.
     *
     * @param {string} objName
     * @param {string} fnName
     * @param {function} func
     * @return {function}
     */
    measure: function(objName, fnName, func) {
      var info = _getNewInfo(objName, fnName);

      var fnArgs = _getFnArguments(func);

      return function() {
        var timeBeforeFn = performanceNow();
        var fnReturn = func.apply(this, arguments);
        var timeAfterFn = performanceNow();

        /**
         * Hold onto arguments in a readable way: args[1] -> args.component.
         * args is also passed to the callback, so if you want to save an
         * argument in the log, do so in the callback.
         */
        var args = {};
        for (var i = 0; i < arguments.length; i++) {
          args[fnArgs[i]] = arguments[i];
        }

        var log = {
          index: ReactDefaultPerf.logs.length,
          fnName: fnName,
          objName: objName,
          timing: {
            before: timeBeforeFn,
            after: timeAfterFn,
            delta: timeAfterFn - timeBeforeFn
          }
        };

        ReactDefaultPerf.logs.push(log);

        /**
         * The callback gets:
         * - this (the component)
         * - the original method's arguments
         * - what the method returned
         * - the log object, and
         * - the wrapped method's info object.
         */
        var callback = _getCallback(objName, fnName);
        callback && callback(this, args, fnReturn, log, info);

        log.timing.timeToLog = performanceNow() - timeAfterFn;

        return fnReturn;
      };
    },

    /**
     * Holds information on wrapped objects/methods.
     * For instance, ReactDefaultPerf.info.React.renderComponent
     */
    info: {},

    /**
     * Holds all of the logs. Filter this to pull desired information.
     */
    logs: [],

    /**
     * Toggle settings for ReactDefaultPerf
     */
    options: {
      /**
       * The heatmap sets the background color of the React containers
       * according to how much total time has been spent rendering them.
       * The most temporally expensive component is set as pure red,
       * and the others are colored from green to red as a fraction
       * of that max component time.
       */
      heatmap: {
        enabled: true
      }
    }
  };

  /**
   * Gets a info area for a given object's function, adding a new one if
   * necessary.
   *
   * @param {string} objName
   * @param {string} fnName
   * @return {object}
   */
  var _getNewInfo = function(objName, fnName) {
    var info = ReactDefaultPerf.getInfo(objName, fnName);
    if (info) {
      return info;
    }
    ReactDefaultPerf.info[objName] = ReactDefaultPerf.info[objName] || {};

    return ReactDefaultPerf.info[objName][fnName] = {
      getLogs: function() {
        return ReactDefaultPerf.getLogs(objName, fnName);
      }
    };
  };

  /**
   * Gets a list of the argument names from a function's definition.
   * This is useful for storing arguments by their names within wrapFn().
   *
   * @param {function} fn
   * @return {array<string>}
   */
  var _getFnArguments = function(fn) {
    var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
    var fnStr = fn.toString().replace(STRIP_COMMENTS, '');
    fnStr = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')'));
    return fnStr.match(/([^\s,]+)/g);
  };

  /**
   * Store common callbacks within ReactDefaultPerf.
   *
   * @param {string} objName
   * @param {string} fnName
   * @return {?function}
   */
  var _getCallback = function(objName, fnName) {
    switch (objName + '.' + fnName) {
      case 'React.renderComponent':
        return _renderComponentCallback;
      case 'ReactNativeComponent.mountComponent':
      case 'ReactNativeComponent.updateComponent':
        return _nativeComponentCallback;
      case 'ReactCompositeComponent.mountComponent':
      case 'ReactCompositeComponent.updateComponent':
        return _compositeComponentCallback;
      default:
        return null;
    }
  };

  /**
   * Callback function for React.renderComponent
   *
   * @param {object} component
   * @param {object} args
   * @param {?object} fnReturn
   * @param {object} log
   * @param {object} info
   */
  var _renderComponentCallback =
    function(component, args, fnReturn, log, info) {
    log.name = args.nextComponent.constructor.displayName || '[unknown]';
    log.reactID = fnReturn._rootNodeID || null;

    if (ReactDefaultPerf.options.heatmap.enabled) {
      var container = args.container;
      if (!container.loggedByReactDefaultPerf) {
        container.loggedByReactDefaultPerf = true;
        info.components = info.components || [];
        info.components.push(container);
      }

      container.count = container.count || 0;
      container.count += log.timing.delta;
      info.max = info.max || 0;
      if (container.count > info.max) {
        info.max = container.count;
        info.components.forEach(function(component) {
          _setHue(component, 100 - 100 * component.count / info.max);
        });
      } else {
        _setHue(container, 100 - 100 * container.count / info.max);
      }
    }
  };

  /**
   * Callback function for ReactNativeComponent
   *
   * @param {object} component
   * @param {object} args
   * @param {?object} fnReturn
   * @param {object} log
   * @param {object} info
   */
  var _nativeComponentCallback =
    function(component, args, fnReturn, log, info) {
    log.name = component.tagName || '[unknown]';
    log.reactID = component._rootNodeID;
  };

  /**
   * Callback function for ReactCompositeComponent
   *
   * @param {object} component
   * @param {object} args
   * @param {?object} fnReturn
   * @param {object} log
   * @param {object} info
   */
  var _compositeComponentCallback =
    function(component, args, fnReturn, log, info) {
    log.name = component.constructor.displayName || '[unknown]';
    log.reactID = component._rootNodeID;
  };

  /**
   * Using the hsl() background-color attribute, colors an element.
   *
   * @param {DOMElement} el
   * @param {number} hue [0 for red, 120 for green, 240 for blue]
   */
  var _setHue = function(el, hue) {
    el.style.backgroundColor = 'hsla(' + hue + ', 100%, 50%, 0.6)';
  };

  /**
   * Round to the thousandth place.
   * @param {number} time
   * @return {number}
   */
  var _microTime = function(time) {
    return Math.round(time * 1000) / 1000;
  };
}

module.exports = ReactDefaultPerf;

},{"./performanceNow":"CoHoju"}],"qPIJ8M":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactEventEmitter
 * @typechecks static-only
 */

"use strict";

var EventConstants = require("./EventConstants");
var EventListener = require("./EventListener");
var EventPluginHub = require("./EventPluginHub");
var ExecutionEnvironment = require("./ExecutionEnvironment");
var ReactEventEmitterMixin = require("./ReactEventEmitterMixin");
var ViewportMetrics = require("./ViewportMetrics");

var invariant = require("./invariant");
var isEventSupported = require("./isEventSupported");
var merge = require("./merge");

/**
 * Summary of `ReactEventEmitter` event handling:
 *
 *  - Top-level delegation is used to trap native browser events. We normalize
 *    and de-duplicate events to account for browser quirks.
 *
 *  - Forward these native events (with the associated top-level type used to
 *    trap it) to `EventPluginHub`, which in turn will ask plugins if they want
 *    to extract any synthetic events.
 *
 *  - The `EventPluginHub` will then process each event by annotating them with
 *    "dispatches", a sequence of listeners and IDs that care about that event.
 *
 *  - The `EventPluginHub` then dispatches the events.
 *
 * Overview of React and the event system:
 *
 *                   .
 * +------------+    .
 * |    DOM     |    .
 * +------------+    .                         +-----------+
 *       +           .               +--------+|SimpleEvent|
 *       |           .               |         |Plugin     |
 * +-----|------+    .               v         +-----------+
 * |     |      |    .    +--------------+                    +------------+
 * |     +-----------.--->|EventPluginHub|                    |    Event   |
 * |            |    .    |              |     +-----------+  | Propagators|
 * | ReactEvent |    .    |              |     |TapEvent   |  |------------|
 * |  Emitter   |    .    |              |<---+|Plugin     |  |other plugin|
 * |            |    .    |              |     +-----------+  |  utilities |
 * |     +-----------.---------+         |                    +------------+
 * |     |      |    .    +----|---------+
 * +-----|------+    .         |      ^        +-----------+
 *       |           .         |      |        |Enter/Leave|
 *       +           .         |      +-------+|Plugin     |
 * +-------------+   .         v               +-----------+
 * | application |   .    +----------+
 * |-------------|   .    | callback |
 * |             |   .    | registry |
 * |             |   .    +----------+
 * +-------------+   .
 *                   .
 *    React Core     .  General Purpose Event Plugin System
 */

/**
 * Traps top-level events by using event bubbling.
 *
 * @param {string} topLevelType Record from `EventConstants`.
 * @param {string} handlerBaseName Event name (e.g. "click").
 * @param {DOMEventTarget} element Element on which to attach listener.
 * @internal
 */
function trapBubbledEvent(topLevelType, handlerBaseName, element) {
  EventListener.listen(
    element,
    handlerBaseName,
    ReactEventEmitter.TopLevelCallbackCreator.createTopLevelCallback(
      topLevelType
    )
  );
}

/**
 * Traps a top-level event by using event capturing.
 *
 * @param {string} topLevelType Record from `EventConstants`.
 * @param {string} handlerBaseName Event name (e.g. "click").
 * @param {DOMEventTarget} element Element on which to attach listener.
 * @internal
 */
function trapCapturedEvent(topLevelType, handlerBaseName, element) {
  EventListener.capture(
    element,
    handlerBaseName,
    ReactEventEmitter.TopLevelCallbackCreator.createTopLevelCallback(
      topLevelType
    )
  );
}

/**
 * Listens to window scroll and resize events. We cache scroll values so that
 * application code can access them without triggering reflows.
 *
 * NOTE: Scroll events do not bubble.
 *
 * @private
 * @see http://www.quirksmode.org/dom/events/scroll.html
 */
function registerScrollValueMonitoring() {
  var refresh = ViewportMetrics.refreshScrollValues;
  EventListener.listen(window, 'scroll', refresh);
  EventListener.listen(window, 'resize', refresh);
}

/**
 * `ReactEventEmitter` is used to attach top-level event listeners. For example:
 *
 *   ReactEventEmitter.putListener('myID', 'onClick', myFunction);
 *
 * This would allocate a "registration" of `('onClick', myFunction)` on 'myID'.
 *
 * @internal
 */
var ReactEventEmitter = merge(ReactEventEmitterMixin, {

  /**
   * React references `ReactEventTopLevelCallback` using this property in order
   * to allow dependency injection.
   */
  TopLevelCallbackCreator: null,

  /**
   * Ensures that top-level event delegation listeners are installed.
   *
   * There are issues with listening to both touch events and mouse events on
   * the top-level, so we make the caller choose which one to listen to. (If
   * there's a touch top-level listeners, anchors don't receive clicks for some
   * reason, and only in some cases).
   *
   * @param {boolean} touchNotMouse Listen to touch events instead of mouse.
   */
  ensureListening: function(touchNotMouse) {
    invariant(ExecutionEnvironment.canUseDOM);
    invariant(ReactEventEmitter.TopLevelCallbackCreator);
    // Call out to base implementation.
    ReactEventEmitterMixin.ensureListening.call(
      ReactEventEmitter,
      touchNotMouse
    );
  },

  /**
   * Sets whether or not any created callbacks should be enabled.
   *
   * @param {boolean} enabled True if callbacks should be enabled.
   */
  setEnabled: function(enabled) {
    invariant(ExecutionEnvironment.canUseDOM);
    if (ReactEventEmitter.TopLevelCallbackCreator) {
      ReactEventEmitter.TopLevelCallbackCreator.setEnabled(enabled);
    }
  },

  /**
   * @return {boolean} True if callbacks are enabled.
   */
  isEnabled: function() {
    return !!(
      ReactEventEmitter.TopLevelCallbackCreator &&
      ReactEventEmitter.TopLevelCallbackCreator.isEnabled()
    );
  },

  /**
   * We listen for bubbled touch events on the document object.
   *
   * Firefox v8.01 (and possibly others) exhibited strange behavior when
   * mounting `onmousemove` events at some node that was not the document
   * element. The symptoms were that if your mouse is not moving over something
   * contained within that mount point (for example on the background) the
   * top-level listeners for `onmousemove` won't be called. However, if you
   * register the `mousemove` on the document object, then it will of course
   * catch all `mousemove`s. This along with iOS quirks, justifies restricting
   * top-level listeners to the document object only, at least for these
   * movement types of events and possibly all events.
   *
   * @see http://www.quirksmode.org/blog/archives/2010/09/click_event_del.html
   *
   * Also, `keyup`/`keypress`/`keydown` do not bubble to the window on IE, but
   * they bubble to document.
   *
   * @param {boolean} touchNotMouse Listen to touch events instead of mouse.
   * @private
   * @see http://www.quirksmode.org/dom/events/keys.html.
   */
  listenAtTopLevel: function(touchNotMouse) {
    invariant(!this._isListening);
    var topLevelTypes = EventConstants.topLevelTypes;
    var mountAt = document;

    registerScrollValueMonitoring();
    trapBubbledEvent(topLevelTypes.topMouseOver, 'mouseover', mountAt);
    trapBubbledEvent(topLevelTypes.topMouseDown, 'mousedown', mountAt);
    trapBubbledEvent(topLevelTypes.topMouseUp, 'mouseup', mountAt);
    trapBubbledEvent(topLevelTypes.topMouseMove, 'mousemove', mountAt);
    trapBubbledEvent(topLevelTypes.topMouseOut, 'mouseout', mountAt);
    trapBubbledEvent(topLevelTypes.topClick, 'click', mountAt);
    trapBubbledEvent(topLevelTypes.topDoubleClick, 'dblclick', mountAt);
    if (touchNotMouse) {
      trapBubbledEvent(topLevelTypes.topTouchStart, 'touchstart', mountAt);
      trapBubbledEvent(topLevelTypes.topTouchEnd, 'touchend', mountAt);
      trapBubbledEvent(topLevelTypes.topTouchMove, 'touchmove', mountAt);
      trapBubbledEvent(topLevelTypes.topTouchCancel, 'touchcancel', mountAt);
    }
    trapBubbledEvent(topLevelTypes.topKeyUp, 'keyup', mountAt);
    trapBubbledEvent(topLevelTypes.topKeyPress, 'keypress', mountAt);
    trapBubbledEvent(topLevelTypes.topKeyDown, 'keydown', mountAt);
    trapBubbledEvent(topLevelTypes.topInput, 'input', mountAt);
    trapBubbledEvent(topLevelTypes.topChange, 'change', mountAt);
    trapBubbledEvent(
      topLevelTypes.topSelectionChange,
      'selectionchange',
      mountAt
    );
    trapBubbledEvent(
      topLevelTypes.topDOMCharacterDataModified,
      'DOMCharacterDataModified',
      mountAt
    );

    if (isEventSupported('drag')) {
      trapBubbledEvent(topLevelTypes.topDrag, 'drag', mountAt);
      trapBubbledEvent(topLevelTypes.topDragEnd, 'dragend', mountAt);
      trapBubbledEvent(topLevelTypes.topDragEnter, 'dragenter', mountAt);
      trapBubbledEvent(topLevelTypes.topDragExit, 'dragexit', mountAt);
      trapBubbledEvent(topLevelTypes.topDragLeave, 'dragleave', mountAt);
      trapBubbledEvent(topLevelTypes.topDragOver, 'dragover', mountAt);
      trapBubbledEvent(topLevelTypes.topDragStart, 'dragstart', mountAt);
      trapBubbledEvent(topLevelTypes.topDrop, 'drop', mountAt);
    }

    if (isEventSupported('wheel')) {
      trapBubbledEvent(topLevelTypes.topWheel, 'wheel', mountAt);
    } else if (isEventSupported('mousewheel')) {
      trapBubbledEvent(topLevelTypes.topWheel, 'mousewheel', mountAt);
    } else {
      // Firefox needs to capture a different mouse scroll event.
      // @see http://www.quirksmode.org/dom/events/tests/scroll.html
      trapBubbledEvent(topLevelTypes.topWheel, 'DOMMouseScroll', mountAt);
    }

    // IE<9 does not support capturing so just trap the bubbled event there.
    if (isEventSupported('scroll', true)) {
      trapCapturedEvent(topLevelTypes.topScroll, 'scroll', mountAt);
    } else {
      trapBubbledEvent(topLevelTypes.topScroll, 'scroll', window);
    }

    if (isEventSupported('focus', true)) {
      trapCapturedEvent(topLevelTypes.topFocus, 'focus', mountAt);
      trapCapturedEvent(topLevelTypes.topBlur, 'blur', mountAt);
    } else if (isEventSupported('focusin')) {
      // IE has `focusin` and `focusout` events which bubble.
      // @see
      // http://www.quirksmode.org/blog/archives/2008/04/delegating_the.html
      trapBubbledEvent(topLevelTypes.topFocus, 'focusin', mountAt);
      trapBubbledEvent(topLevelTypes.topBlur, 'focusout', mountAt);
    }
  },

  registrationNames: EventPluginHub.registrationNames,

  putListener: EventPluginHub.putListener,

  getListener: EventPluginHub.getListener,

  deleteListener: EventPluginHub.deleteListener,

  deleteAllListeners: EventPluginHub.deleteAllListeners,

  trapBubbledEvent: trapBubbledEvent,

  trapCapturedEvent: trapCapturedEvent

});


module.exports = ReactEventEmitter;

},{"./EventConstants":"Gaqr6V","./EventListener":"e0NKSL","./EventPluginHub":"EddLdT","./ExecutionEnvironment":"mrmvk9","./ReactEventEmitterMixin":"cwSdrc","./ViewportMetrics":"sk6wio","./invariant":"hPxNWC","./isEventSupported":"Iv78kc","./merge":"7duoWY"}],"cwSdrc":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactEventEmitterMixin
 */

"use strict";

var EventPluginHub = require("./EventPluginHub");
var ReactUpdates = require("./ReactUpdates");

var ReactEventEmitterMixin = {
  /**
   * Whether or not `ensureListening` has been invoked.
   * @type {boolean}
   * @private
   */
  _isListening: false,

  /**
   * Function, must be implemented. Listens to events on the top level of the
   * application.
   *
   * @abstract
   *
   * listenAtTopLevel: null,
   */

  /**
   * Ensures that top-level event delegation listeners are installed.
   *
   * There are issues with listening to both touch events and mouse events on
   * the top-level, so we make the caller choose which one to listen to. (If
   * there's a touch top-level listeners, anchors don't receive clicks for some
   * reason, and only in some cases).
   *
   * @param {*} config Configuration passed through to `listenAtTopLevel`.
   */
  ensureListening: function(config) {
    if (!this._isListening) {
      this.listenAtTopLevel(config);
      this._isListening = true;
    }
  },

  /**
   * Streams a fired top-level event to `EventPluginHub` where plugins have the
   * opportunity to create `ReactEvent`s to be dispatched.
   *
   * @param {string} topLevelType Record from `EventConstants`.
   * @param {object} topLevelTarget The listening component root node.
   * @param {string} topLevelTargetID ID of `topLevelTarget`.
   * @param {object} nativeEvent Native environment event.
   */
  handleTopLevel: function(
      topLevelType,
      topLevelTarget,
      topLevelTargetID,
      nativeEvent) {
    var events = EventPluginHub.extractEvents(
      topLevelType,
      topLevelTarget,
      topLevelTargetID,
      nativeEvent
    );

    // Event queue being processed in the same cycle allows `preventDefault`.
    ReactUpdates.batchedUpdates(function() {
      EventPluginHub.enqueueEvents(events);
      EventPluginHub.processEventQueue();
    });
  }
};

module.exports = ReactEventEmitterMixin;

},{"./EventPluginHub":"EddLdT","./ReactUpdates":"dwYRw4"}],"f4CWDK":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactEventTopLevelCallback
 * @typechecks static-only
 */

"use strict";

var ExecutionEnvironment = require("./ExecutionEnvironment");
var ReactEventEmitter = require("./ReactEventEmitter");
var ReactMount = require("./ReactMount");

var getEventTarget = require("./getEventTarget");

/**
 * @type {boolean}
 * @private
 */
var _topLevelListenersEnabled = true;

/**
 * Top-level callback creator used to implement event handling using delegation.
 * This is used via dependency injection.
 */
var ReactEventTopLevelCallback = {

  /**
   * Sets whether or not any created callbacks should be enabled.
   *
   * @param {boolean} enabled True if callbacks should be enabled.
   */
  setEnabled: function(enabled) {
    _topLevelListenersEnabled = !!enabled;
  },

  /**
   * @return {boolean} True if callbacks are enabled.
   */
  isEnabled: function() {
    return _topLevelListenersEnabled;
  },

  /**
   * Creates a callback for the supplied `topLevelType` that could be added as
   * a listener to the document. The callback computes a `topLevelTarget` which
   * should be the root node of a mounted React component where the listener
   * is attached.
   *
   * @param {string} topLevelType Record from `EventConstants`.
   * @return {function} Callback for handling top-level events.
   */
  createTopLevelCallback: function(topLevelType) {
    return function(nativeEvent) {
      if (!_topLevelListenersEnabled) {
        return;
      }
      // TODO: Remove when synthetic events are ready, this is for IE<9.
      if (nativeEvent.srcElement &&
          nativeEvent.srcElement !== nativeEvent.target) {
        nativeEvent.target = nativeEvent.srcElement;
      }
      var topLevelTarget = ReactMount.getFirstReactDOM(
        getEventTarget(nativeEvent)
      ) || ExecutionEnvironment.global;
      var topLevelTargetID = ReactMount.getID(topLevelTarget) || '';
      ReactEventEmitter.handleTopLevel(
        topLevelType,
        topLevelTarget,
        topLevelTargetID,
        nativeEvent
      );
    };
  }

};

module.exports = ReactEventTopLevelCallback;

},{"./ExecutionEnvironment":"mrmvk9","./ReactEventEmitter":"qPIJ8M","./ReactMount":"1R+7Eu","./getEventTarget":"eoIwTT"}],"eT7xLu":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactInputSelection
 */

"use strict";

// It is not safe to read the document.activeElement property in IE if there's
// nothing focused.
function getActiveElement() {
  try {
    return document.activeElement;
  } catch (e) {
  }
}

function isInDocument(node) {
  return document.documentElement.contains(node);
}

/**
 * @ReactInputSelection: React input selection module. Based on Selection.js,
 * but modified to be suitable for react and has a couple of bug fixes (doesn't
 * assume buttons have range selections allowed).
 * Input selection module for React.
 */
var ReactInputSelection = {

  hasSelectionCapabilities: function(elem) {
    return elem && (
      (elem.nodeName === 'INPUT' && elem.type === 'text') ||
      elem.nodeName === 'TEXTAREA' ||
      elem.contentEditable === 'true'
    );
  },

  getSelectionInformation: function() {
    var focusedElem = getActiveElement();
    return {
      focusedElem: focusedElem,
      selectionRange:
          ReactInputSelection.hasSelectionCapabilities(focusedElem) ?
          ReactInputSelection.getSelection(focusedElem) :
          null
    };
  },

  /**
   * @restoreSelection: If any selection information was potentially lost,
   * restore it. This is useful when performing operations that could remove dom
   * nodes and place them back in, resulting in focus being lost.
   */
  restoreSelection: function(priorSelectionInformation) {
    var curFocusedElem = getActiveElement();
    var priorFocusedElem = priorSelectionInformation.focusedElem;
    var priorSelectionRange = priorSelectionInformation.selectionRange;
    if (curFocusedElem !== priorFocusedElem &&
        isInDocument(priorFocusedElem)) {
      if (ReactInputSelection.hasSelectionCapabilities(priorFocusedElem)) {
        ReactInputSelection.setSelection(
          priorFocusedElem,
          priorSelectionRange
        );
      }
      priorFocusedElem.focus();
    }
  },

  /**
   * @getSelection: Gets the selection bounds of a textarea or input.
   * -@input: Look up selection bounds of this input or textarea
   * -@return {start: selectionStart, end: selectionEnd}
   */
  getSelection: function(input) {
    var range;
    if (input.contentEditable === 'true' && window.getSelection) {
      range = window.getSelection().getRangeAt(0);
      var commonAncestor = range.commonAncestorContainer;
      if (commonAncestor && commonAncestor.nodeType === 3) {
        commonAncestor = commonAncestor.parentNode;
      }
      if (commonAncestor !== input) {
        return {start: 0, end: 0};
      } else {
        return {start: range.startOffset, end: range.endOffset};
      }
    }

    if (!document.selection) {
      // Mozilla, Safari, etc.
      return {start: input.selectionStart, end: input.selectionEnd};
    }

    range = document.selection.createRange();
    if (range.parentElement() !== input) {
      // There can only be one selection per document in IE, so if the
      // containing element of the document's selection isn't our text field,
      // our text field must have no selection.
      return {start: 0, end: 0};
    }

    var length = input.value.length;

    if (input.nodeName === 'INPUT') {
      return {
        start: -range.moveStart('character', -length),
        end: -range.moveEnd('character', -length)
      };
    } else {
      var range2 = range.duplicate();
      range2.moveToElementText(input);
      range2.setEndPoint('StartToEnd', range);
      var end = length - range2.text.length;
      range2.setEndPoint('StartToStart', range);
      return {
        start: length - range2.text.length,
        end:   end
      };
    }
  },

  /**
   * @setSelection: Sets the selection bounds of a textarea or input and focuses
   * the input.
   * -@input     Set selection bounds of this input or textarea
   * -@rangeObj Object of same form that is returned from get*
   */
  setSelection: function(input, rangeObj) {
    var range;
    var start = rangeObj.start;
    var end = rangeObj.end;
    if (typeof end === 'undefined') {
      end = start;
    }
    if (document.selection) {
      // IE is inconsistent about character offsets when it comes to carriage
      // returns, so we need to manually take them into account
      if (input.tagName === 'TEXTAREA') {
        var cr_before =
          (input.value.slice(0, start).match(/\r/g) || []).length;
        var cr_inside =
          (input.value.slice(start, end).match(/\r/g) || []).length;
        start -= cr_before;
        end -= cr_before + cr_inside;
      }
      range = input.createTextRange();
      range.collapse(true);
      range.moveStart('character', start);
      range.moveEnd('character', end - start);
      range.select();
    } else {
      if (input.contentEditable === 'true') {
        if (input.childNodes.length === 1) {
          range = document.createRange();
          range.setStart(input.childNodes[0], start);
          range.setEnd(input.childNodes[0], end);
          var sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        }
      } else {
        input.selectionStart = start;
        input.selectionEnd = Math.min(end, input.value.length);
        input.focus();
      }
    }
  }

};

module.exports = ReactInputSelection;

},{}],"owd960":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactInstanceHandles
 * @typechecks static-only
 */

"use strict";

var invariant = require("./invariant");

var SEPARATOR = '.';
var SEPARATOR_LENGTH = SEPARATOR.length;

/**
 * Maximum depth of traversals before we consider the possibility of a bad ID.
 */
var MAX_TREE_DEPTH = 100;

/**
 * Size of the reactRoot ID space. We generate random numbers for React root
 * IDs and if there's a collision the events and DOM update system will
 * get confused. If we assume 100 React components per page, and a user
 * loads 1 page per minute 24/7 for 50 years, with a mount point space of
 * 9,999,999 the likelihood of never having a collision is 99.997%.
 */
var GLOBAL_MOUNT_POINT_MAX = 9999999;

/**
 * Creates a DOM ID prefix to use when mounting React components.
 *
 * @param {number} index A unique integer
 * @return {string} React root ID.
 * @internal
 */
function getReactRootIDString(index) {
  return SEPARATOR + 'r[' + index.toString(36) + ']';
}

/**
 * Checks if a character in the supplied ID is a separator or the end.
 *
 * @param {string} id A React DOM ID.
 * @param {number} index Index of the character to check.
 * @return {boolean} True if the character is a separator or end of the ID.
 * @private
 */
function isBoundary(id, index) {
  return id.charAt(index) === SEPARATOR || index === id.length;
}

/**
 * Checks if the supplied string is a valid React DOM ID.
 *
 * @param {string} id A React DOM ID, maybe.
 * @return {boolean} True if the string is a valid React DOM ID.
 * @private
 */
function isValidID(id) {
  return id === '' || (
    id.charAt(0) === SEPARATOR && id.charAt(id.length - 1) !== SEPARATOR
  );
}

/**
 * Checks if the first ID is an ancestor of or equal to the second ID.
 *
 * @param {string} ancestorID
 * @param {string} descendantID
 * @return {boolean} True if `ancestorID` is an ancestor of `descendantID`.
 * @internal
 */
function isAncestorIDOf(ancestorID, descendantID) {
  return (
    descendantID.indexOf(ancestorID) === 0 &&
    isBoundary(descendantID, ancestorID.length)
  );
}

/**
 * Gets the parent ID of the supplied React DOM ID, `id`.
 *
 * @param {string} id ID of a component.
 * @return {string} ID of the parent, or an empty string.
 * @private
 */
function getParentID(id) {
  return id ? id.substr(0, id.lastIndexOf(SEPARATOR)) : '';
}

/**
 * Gets the next DOM ID on the tree path from the supplied `ancestorID` to the
 * supplied `destinationID`. If they are equal, the ID is returned.
 *
 * @param {string} ancestorID ID of an ancestor node of `destinationID`.
 * @param {string} destinationID ID of the destination node.
 * @return {string} Next ID on the path from `ancestorID` to `destinationID`.
 * @private
 */
function getNextDescendantID(ancestorID, destinationID) {
  invariant(isValidID(ancestorID) && isValidID(destinationID));
  invariant(isAncestorIDOf(ancestorID, destinationID));
  if (ancestorID === destinationID) {
    return ancestorID;
  }
  // Skip over the ancestor and the immediate separator. Traverse until we hit
  // another separator or we reach the end of `destinationID`.
  var start = ancestorID.length + SEPARATOR_LENGTH;
  for (var i = start; i < destinationID.length; i++) {
    if (isBoundary(destinationID, i)) {
      break;
    }
  }
  return destinationID.substr(0, i);
}

/**
 * Gets the nearest common ancestor ID of two IDs.
 *
 * Using this ID scheme, the nearest common ancestor ID is the longest common
 * prefix of the two IDs that immediately preceded a "marker" in both strings.
 *
 * @param {string} oneID
 * @param {string} twoID
 * @return {string} Nearest common ancestor ID, or the empty string if none.
 * @private
 */
function getFirstCommonAncestorID(oneID, twoID) {
  var minLength = Math.min(oneID.length, twoID.length);
  if (minLength === 0) {
    return '';
  }
  var lastCommonMarkerIndex = 0;
  // Use `<=` to traverse until the "EOL" of the shorter string.
  for (var i = 0; i <= minLength; i++) {
    if (isBoundary(oneID, i) && isBoundary(twoID, i)) {
      lastCommonMarkerIndex = i;
    } else if (oneID.charAt(i) !== twoID.charAt(i)) {
      break;
    }
  }
  var longestCommonID = oneID.substr(0, lastCommonMarkerIndex);
  invariant(isValidID(longestCommonID));
  return longestCommonID;
}

/**
 * Traverses the parent path between two IDs (either up or down). The IDs must
 * not be the same, and there must exist a parent path between them.
 *
 * @param {?string} start ID at which to start traversal.
 * @param {?string} stop ID at which to end traversal.
 * @param {function} cb Callback to invoke each ID with.
 * @param {?boolean} skipFirst Whether or not to skip the first node.
 * @param {?boolean} skipLast Whether or not to skip the last node.
 * @private
 */
function traverseParentPath(start, stop, cb, arg, skipFirst, skipLast) {
  start = start || '';
  stop = stop || '';
  invariant(start !== stop);
  var traverseUp = isAncestorIDOf(stop, start);
  invariant(traverseUp || isAncestorIDOf(start, stop));
  // Traverse from `start` to `stop` one depth at a time.
  var depth = 0;
  var traverse = traverseUp ? getParentID : getNextDescendantID;
  for (var id = start; /* until break */; id = traverse(id, stop)) {
    if ((!skipFirst || id !== start) && (!skipLast || id !== stop)) {
      cb(id, traverseUp, arg);
    }
    if (id === stop) {
      // Only break //after// visiting `stop`.
      break;
    }
    invariant(depth++ < MAX_TREE_DEPTH);
  }
}

/**
 * Manages the IDs assigned to DOM representations of React components. This
 * uses a specific scheme in order to traverse the DOM efficiently (e.g. in
 * order to simulate events).
 *
 * @internal
 */
var ReactInstanceHandles = {

  createReactRootID: function() {
    return getReactRootIDString(
      Math.ceil(Math.random() * GLOBAL_MOUNT_POINT_MAX)
    );
  },

  /**
   * Constructs a React ID by joining a root ID with a name.
   *
   * @param {string} rootID Root ID of a parent component.
   * @param {string} name A component's name (as flattened children).
   * @return {string} A React ID.
   * @internal
   */
  createReactID: function(rootID, name) {
    return rootID + SEPARATOR + name;
  },

  /**
   * Gets the DOM ID of the React component that is the root of the tree that
   * contains the React component with the supplied DOM ID.
   *
   * @param {string} id DOM ID of a React component.
   * @return {?string} DOM ID of the React component that is the root.
   * @internal
   */
  getReactRootIDFromNodeID: function(id) {
    var regexResult = /\.r\[[^\]]+\]/.exec(id);
    return regexResult && regexResult[0];
  },

  /**
   * Traverses the ID hierarchy and invokes the supplied `cb` on any IDs that
   * should would receive a `mouseEnter` or `mouseLeave` event.
   *
   * NOTE: Does not invoke the callback on the nearest common ancestor because
   * nothing "entered" or "left" that element.
   *
   * @param {string} leaveID ID being left.
   * @param {string} enterID ID being entered.
   * @param {function} cb Callback to invoke on each entered/left ID.
   * @param {*} upArg Argument to invoke the callback with on left IDs.
   * @param {*} downArg Argument to invoke the callback with on entered IDs.
   * @internal
   */
  traverseEnterLeave: function(leaveID, enterID, cb, upArg, downArg) {
    var ancestorID = getFirstCommonAncestorID(leaveID, enterID);
    if (ancestorID !== leaveID) {
      traverseParentPath(leaveID, ancestorID, cb, upArg, false, true);
    }
    if (ancestorID !== enterID) {
      traverseParentPath(ancestorID, enterID, cb, downArg, true, false);
    }
  },

  /**
   * Simulates the traversal of a two-phase, capture/bubble event dispatch.
   *
   * NOTE: This traversal happens on IDs without touching the DOM.
   *
   * @param {string} targetID ID of the target node.
   * @param {function} cb Callback to invoke.
   * @param {*} arg Argument to invoke the callback with.
   * @internal
   */
  traverseTwoPhase: function(targetID, cb, arg) {
    if (targetID) {
      traverseParentPath('', targetID, cb, arg, true, false);
      traverseParentPath(targetID, '', cb, arg, false, true);
    }
  },

  /**
   * Exposed for unit testing.
   * @private
   */
  _getFirstCommonAncestorID: getFirstCommonAncestorID,

  /**
   * Exposed for unit testing.
   * @private
   */
  _getNextDescendantID: getNextDescendantID,

  isAncestorIDOf: isAncestorIDOf,

  SEPARATOR: SEPARATOR

};

module.exports = ReactInstanceHandles;

},{"./invariant":"hPxNWC"}],"TUHHsM":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactMarkupChecksum
 */

"use strict";

var adler32 = require("./adler32");

var ReactMarkupChecksum = {
  CHECKSUM_ATTR_NAME: 'data-react-checksum',

  /**
   * @param {string} markup Markup string
   * @return {string} Markup string with checksum attribute attached
   */
  addChecksumToMarkup: function(markup) {
    var checksum = adler32(markup);
    return markup.replace(
      '>',
      ' ' + ReactMarkupChecksum.CHECKSUM_ATTR_NAME + '="' + checksum + '">'
    );
  },

  /**
   * @param {string} markup to use
   * @param {DOMElement} element root React element
   * @returns {boolean} whether or not the markup is the same
   */
  canReuseMarkup: function(markup, element) {
    var existingChecksum = element.getAttribute(
      ReactMarkupChecksum.CHECKSUM_ATTR_NAME
    );
    existingChecksum = existingChecksum && parseInt(existingChecksum, 10);
    var markupChecksum = adler32(markup);
    return markupChecksum === existingChecksum;
  }
};

module.exports = ReactMarkupChecksum;

},{"./adler32":"5ukn/R"}],"1R+7Eu":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactMount
 */

"use strict";
var invariant = require("./invariant");
var getReactRootElementInContainer = require("./getReactRootElementInContainer");
var ReactEventEmitter = require("./ReactEventEmitter");
var ReactInstanceHandles = require("./ReactInstanceHandles");
var SEPARATOR = ReactInstanceHandles.SEPARATOR;
var ATTR_NAME = 'data-reactid';
var nodeCache = {};
var $ = require("./$");

/** Mapping from reactRootID to React component instance. */
var instanceByReactRootID = {};

/** Mapping from reactRootID to `container` nodes. */
var containersByReactRootID = {};

/**
 * @param {DOMElement} container DOM element that may contain a React component.
 * @return {?string} A "reactRoot" ID, if a React component is rendered.
 */
function getReactRootID(container) {
  var rootElement = getReactRootElementInContainer(container);
  return rootElement && ReactMount.getID(rootElement);
}

/**
 * Accessing node[ATTR_NAME] or calling getAttribute(ATTR_NAME) on a form
 * element can return its control whose name or ID equals ATTR_NAME. All
 * DOM nodes support `getAttributeNode` but this can also get called on
 * other objects so just return '' if we're given something other than a
 * DOM node (such as window).
 *
 * @param {?DOMElement|DOMWindow|DOMDocument|DOMTextNode} node DOM node.
 * @return {string} ID of the supplied `domNode`.
 */
function getID(node) {
  var id = internalGetID(node);
  if (id) {
    if (nodeCache.hasOwnProperty(id)) {
      var cached = nodeCache[id];
      if (cached !== node) {
        invariant(!isValid(cached, id));

        nodeCache[id] = node;
      }
    } else {
      nodeCache[id] = node;
    }
  }

  return id;
}

function internalGetID(node) {
  // If node is something like a window, document, or text node, none of
  // which support attributes or a .getAttribute method, gracefully return
  // the empty string, as if the attribute were missing.
  return node && node.getAttribute && node.getAttribute(ATTR_NAME) || '';
}

/**
 * Sets the React-specific ID of the given node.
 *
 * @param {DOMElement} node The DOM node whose ID will be set.
 * @param {string} id The value of the ID attribute.
 */
function setID(node, id) {
  var oldID = internalGetID(node);
  if (oldID !== id) {
    delete nodeCache[oldID];
  }
  node.setAttribute(ATTR_NAME, id);
  nodeCache[id] = node;
}

/**
 * Finds the node with the supplied React-generated DOM ID.
 *
 * @param {string} id A React-generated DOM ID.
 * @return {DOMElement} DOM node with the suppled `id`.
 * @internal
 */
function getNode(id) {
  if (!nodeCache.hasOwnProperty(id) || !isValid(nodeCache[id], id)) {
    nodeCache[id] = ReactMount.findReactNodeByID(id);
  }
  return nodeCache[id];
}

/**
 * A node is "valid" if it is contained by a currently mounted container.
 *
 * This means that the node does not have to be contained by a document in
 * order to be considered valid.
 *
 * @param {?DOMElement} node The candidate DOM node.
 * @param {string} id The expected ID of the node.
 * @return {boolean} Whether the node is contained by a mounted container.
 */
function isValid(node, id) {
  if (node) {
    invariant(internalGetID(node) === id);

    var container = ReactMount.findReactContainerForID(id);
    if (container && contains(container, node)) {
      return true;
    }
  }

  return false;
}

function contains(ancestor, descendant) {
  if (ancestor.contains) {
    // Supported natively in virtually all browsers, but not in jsdom.
    return ancestor.contains(descendant);
  }

  if (descendant === ancestor) {
    return true;
  }

  if (descendant.nodeType === 3) {
    // If descendant is a text node, start from descendant.parentNode
    // instead, so that we can assume all ancestors worth considering are
    // element nodes with nodeType === 1.
    descendant = descendant.parentNode;
  }

  while (descendant && descendant.nodeType === 1) {
    if (descendant === ancestor) {
      return true;
    }
    descendant = descendant.parentNode;
  }

  return false;
}

/**
 * Causes the cache to forget about one React-specific ID.
 *
 * @param {string} id The ID to forget.
 */
function purgeID(id) {
  delete nodeCache[id];
}

/**
 * Mounting is the process of initializing a React component by creatings its
 * representative DOM elements and inserting them into a supplied `container`.
 * Any prior content inside `container` is destroyed in the process.
 *
 *   ReactMount.renderComponent(component, $('container'));
 *
 *   <div id="container">                   <-- Supplied `container`.
 *     <div data-reactid=".r[3]">           <-- Rendered reactRoot of React
 *       // ...                                 component.
 *     </div>
 *   </div>
 *
 * Inside of `container`, the first element rendered is the "reactRoot".
 */
var ReactMount = {
  /**
   * Safety guard to prevent accidentally rendering over the entire HTML tree.
   */
  allowFullPageRender: false,

  /** Time spent generating markup. */
  totalInstantiationTime: 0,

  /** Time spent inserting markup into the DOM. */
  totalInjectionTime: 0,

  /** Whether support for touch events should be initialized. */
  useTouchEvents: false,

  /** Exposed for debugging purposes **/
  _instanceByReactRootID: instanceByReactRootID,

  /**
   * This is a hook provided to support rendering React components while
   * ensuring that the apparent scroll position of its `container` does not
   * change.
   *
   * @param {DOMElement} container The `container` being rendered into.
   * @param {function} renderCallback This must be called once to do the render.
   */
  scrollMonitor: function(container, renderCallback) {
    renderCallback();
  },

  /**
   * Ensures that the top-level event delegation listener is set up. This will
   * be invoked some time before the first time any React component is rendered.
   *
   * @private
   */
  prepareEnvironmentForDOM: function() {
    ReactEventEmitter.ensureListening(ReactMount.useTouchEvents);
  },

  /**
   * Take a component that's already mounted into the DOM and replace its props
   * @param {ReactComponent} prevComponent component instance already in the DOM
   * @param {ReactComponent} nextComponent component instance to render
   * @param {DOMElement} container container to render into
   * @param {?function} callback function triggered on completion
   */
  _updateRootComponent: function(
      prevComponent,
      nextComponent,
      container,
      callback) {
      var nextProps = nextComponent.props;

      ReactMount.scrollMonitor(container, function() {
        prevComponent.replaceProps(nextProps, callback);
      });

      return prevComponent;
  },

  /**
   * Register a component into the instance map and start the events system.
   * @param {ReactComponent} nextComponent component instance to render
   * @param {DOMElement} container container to render into
   * @return {string} reactRoot ID prefix
   */
  _registerComponent: function(nextComponent, container) {
    ReactMount.prepareEnvironmentForDOM();

    var reactRootID = ReactMount.registerContainer(container);
    instanceByReactRootID[reactRootID] = nextComponent;
    return reactRootID;
  },

  /**
   * Render a new component into the DOM.
   * @param {ReactComponent} nextComponent component instance to render
   * @param {DOMElement} container container to render into
   * @param {boolean} shouldReuseMarkup if we should skip the markup insertion
   * @return {ReactComponent} nextComponent
   */
  _renderNewRootComponent: function(
      nextComponent,
      container,
      shouldReuseMarkup) {
      var reactRootID = ReactMount._registerComponent(nextComponent, container);

      nextComponent.mountComponentIntoNode(
        reactRootID,
        container,
        shouldReuseMarkup
      );

      return nextComponent;
  },

  /**
   * Renders a React component into the DOM in the supplied `container`.
   *
   * If the React component was previously rendered into `container`, this will
   * perform an update on it and only mutate the DOM as necessary to reflect the
   * latest React component.
   *
   * @param {ReactComponent} nextComponent Component instance to render.
   * @param {DOMElement} container DOM element to render into.
   * @param {?function} callback function triggered on completion
   * @return {ReactComponent} Component instance rendered in `container`.
   */
  renderComponent: function(nextComponent, container, callback) {
    var registeredComponent = instanceByReactRootID[getReactRootID(container)];

    if (registeredComponent) {
      if (registeredComponent.constructor === nextComponent.constructor) {
        return ReactMount._updateRootComponent(
          registeredComponent,
          nextComponent,
          container,
          callback
        );
      } else {
        ReactMount.unmountAndReleaseReactRootNode(container);
      }
    }

    var reactRootElement = getReactRootElementInContainer(container);
    var containerHasReactMarkup =
      reactRootElement && ReactMount.isRenderedByReact(reactRootElement);

    var shouldReuseMarkup = containerHasReactMarkup && !registeredComponent;

    var component = ReactMount._renderNewRootComponent(
      nextComponent,
      container,
      shouldReuseMarkup
    );
    callback && callback();
    return component;
  },

  /**
   * Constructs a component instance of `constructor` with `initialProps` and
   * renders it into the supplied `container`.
   *
   * @param {function} constructor React component constructor.
   * @param {?object} props Initial props of the component instance.
   * @param {DOMElement} container DOM element to render into.
   * @return {ReactComponent} Component instance rendered in `container`.
   */
  constructAndRenderComponent: function(constructor, props, container) {
    return ReactMount.renderComponent(constructor(props), container);
  },

  /**
   * Constructs a component instance of `constructor` with `initialProps` and
   * renders it into a container node identified by supplied `id`.
   *
   * @param {function} componentConstructor React component constructor
   * @param {?object} props Initial props of the component instance.
   * @param {string} id ID of the DOM element to render into.
   * @return {ReactComponent} Component instance rendered in the container node.
   */
  constructAndRenderComponentByID: function(constructor, props, id) {
    return ReactMount.constructAndRenderComponent(constructor, props, $(id));
  },

  /**
   * Registers a container node into which React components will be rendered.
   * This also creates the "reatRoot" ID that will be assigned to the element
   * rendered within.
   *
   * @param {DOMElement} container DOM element to register as a container.
   * @return {string} The "reactRoot" ID of elements rendered within.
   */
  registerContainer: function(container) {
    var reactRootID = getReactRootID(container);
    if (reactRootID) {
      // If one exists, make sure it is a valid "reactRoot" ID.
      reactRootID = ReactInstanceHandles.getReactRootIDFromNodeID(reactRootID);
    }
    if (!reactRootID) {
      // No valid "reactRoot" ID found, create one.
      reactRootID = ReactInstanceHandles.createReactRootID();
    }
    containersByReactRootID[reactRootID] = container;
    return reactRootID;
  },

  /**
   * Unmounts and destroys the React component rendered in the `container`.
   *
   * @param {DOMElement} container DOM element containing a React component.
   * @return {boolean} True if a component was found in and unmounted from
   *                   `container`
   */
  unmountAndReleaseReactRootNode: function(container) {
      var reactRootID = getReactRootID(container);
      var component = instanceByReactRootID[reactRootID];

      if (!component) {
        return false;
      }

      ReactMount.unmountComponentFromNode(component, container);
      delete instanceByReactRootID[reactRootID];
      delete containersByReactRootID[reactRootID];
      return true;
  },

  /**
   * Unmounts a component and removes it from the DOM.
   *
   * @param {ReactComponent} instance React component instance.
   * @param {DOMElement} container DOM element to unmount from.
   * @final
   * @internal
   * @see {ReactMount.unmountAndReleaseReactRootNode}
   */
  unmountComponentFromNode: function(instance, container) {
    instance.unmountComponent();

    // http://jsperf.com/emptying-a-node
    while (container.lastChild) {
      container.removeChild(container.lastChild);
    }
  },

  /**
   * Finds the container DOM element that contains React component to which the
   * supplied DOM `id` belongs.
   *
   * @param {string} id The ID of an element rendered by a React component.
   * @return {?DOMElement} DOM element that contains the `id`.
   */
  findReactContainerForID: function(id) {
      var reactRootID = ReactInstanceHandles.getReactRootIDFromNodeID(id);
      var container = containersByReactRootID[reactRootID];
      return container;
  },

  /**
   * Finds an element rendered by React with the supplied ID.
   *
   * @param {string} id ID of a DOM node in the React component.
   * @return {DOMElement} Root DOM node of the React component.
   */
  findReactNodeByID: function(id) {
    var reactRoot = ReactMount.findReactContainerForID(id);
    return ReactMount.findComponentRoot(reactRoot, id);
  },

  /**
   * True if the supplied `node` is rendered by React.
   *
   * @param {*} node DOM Element to check.
   * @return {boolean} True if the DOM Element appears to be rendered by React.
   * @internal
   */
  isRenderedByReact: function(node) {
    if (node.nodeType !== 1) {
      // Not a DOMElement, therefore not a React component
      return false;
    }
    var id = ReactMount.getID(node);
    return id ? id.charAt(0) === SEPARATOR : false;
  },

  /**
   * Traverses up the ancestors of the supplied node to find a node that is a
   * DOM representation of a React component.
   *
   * @param {*} node
   * @return {?DOMEventTarget}
   * @internal
   */
  getFirstReactDOM: function(node) {
    var current = node;
    while (current && current.parentNode !== current) {
      if (ReactMount.isRenderedByReact(current)) {
        return current;
      }
      current = current.parentNode;
    }
    return null;
  },

  /**
   * Finds a node with the supplied `id` inside of the supplied `ancestorNode`.
   * Exploits the ID naming scheme to perform the search quickly.
   *
   * @param {DOMEventTarget} ancestorNode Search from this root.
   * @pararm {string} id ID of the DOM representation of the component.
   * @return {DOMEventTarget} DOM node with the supplied `id`.
   * @internal
   */
  findComponentRoot: function(ancestorNode, id) {
      var firstChildren = [ancestorNode.firstChild];
      var childIndex = 0;

      while (childIndex < firstChildren.length) {
        var child = firstChildren[childIndex++];
        while (child) {
          var childID = ReactMount.getID(child);
          if (childID) {
            if (id === childID) {
              return child;
            } else if (ReactInstanceHandles.isAncestorIDOf(childID, id)) {
              // If we find a child whose ID is an ancestor of the given ID,
              // then we can be sure that we only want to search the subtree
              // rooted at this child, so we can throw out the rest of the
              // search state.
              firstChildren.length = childIndex = 0;
              firstChildren.push(child.firstChild);
              break;
            } else {
              // TODO This should not be necessary if the ID hierarchy is
              // correct, but is occasionally necessary if the DOM has been
              // modified in unexpected ways.
              firstChildren.push(child.firstChild);
            }
          } else {
            // If this child had no ID, then there's a chance that it was
            // injected automatically by the browser, as when a `<table>`
            // element sprouts an extra `<tbody>` child as a side effect of
            // `.innerHTML` parsing. Optimistically continue down this
            // branch, but not before examining the other siblings.
            firstChildren.push(child.firstChild);
          }
          child = child.nextSibling;
        }
      }

      invariant(false);
  },


  /**
   * React ID utilities.
   */

  ATTR_NAME: ATTR_NAME,

  getID: getID,

  setID: setID,

  getNode: getNode,

  purgeID: purgeID,

  injection: {}
};

module.exports = ReactMount;

},{"./$":"9iYy0C","./ReactEventEmitter":"qPIJ8M","./ReactInstanceHandles":"owd960","./getReactRootElementInContainer":"sz+OE9","./invariant":"hPxNWC"}],"UlnLr0":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactMultiChild
 * @typechecks static-only
 */

"use strict";

var ReactComponent = require("./ReactComponent");
var ReactMultiChildUpdateTypes = require("./ReactMultiChildUpdateTypes");

/**
 * Given a `curChild` and `newChild`, determines if `curChild` should be
 * updated as opposed to being destroyed or replaced.
 *
 * @param {?ReactComponent} curChild
 * @param {?ReactComponent} newChild
 * @return {boolean} True if `curChild` should be updated with `newChild`.
 * @protected
 */
function shouldUpdateChild(curChild, newChild) {
  return curChild && newChild && curChild.constructor === newChild.constructor;
}

/**
 * Updating children of a component may trigger recursive updates. The depth is
 * used to batch recursive updates to render markup more efficiently.
 *
 * @type {number}
 * @private
 */
var updateDepth = 0;

/**
 * Queue of update configuration objects.
 *
 * Each object has a `type` property that is in `ReactMultiChildUpdateTypes`.
 *
 * @type {array<object>}
 * @private
 */
var updateQueue = [];

/**
 * Queue of markup to be rendered.
 *
 * @type {array<string>}
 * @private
 */
var markupQueue = [];

/**
 * Enqueues markup to be rendered and inserted at a supplied index.
 *
 * @param {string} parentID ID of the parent component.
 * @param {string} markup Markup that renders into an element.
 * @param {number} toIndex Destination index.
 * @private
 */
function enqueueMarkup(parentID, markup, toIndex) {
  // NOTE: Null values reduce hidden classes.
  updateQueue.push({
    parentID: parentID,
    parentNode: null,
    type: ReactMultiChildUpdateTypes.INSERT_MARKUP,
    markupIndex: markupQueue.push(markup) - 1,
    fromIndex: null,
    textContent: null,
    toIndex: toIndex
  });
}

/**
 * Enqueues moving an existing element to another index.
 *
 * @param {string} parentID ID of the parent component.
 * @param {number} fromIndex Source index of the existing element.
 * @param {number} toIndex Destination index of the element.
 * @private
 */
function enqueueMove(parentID, fromIndex, toIndex) {
  // NOTE: Null values reduce hidden classes.
  updateQueue.push({
    parentID: parentID,
    parentNode: null,
    type: ReactMultiChildUpdateTypes.MOVE_EXISTING,
    markupIndex: null,
    textContent: null,
    fromIndex: fromIndex,
    toIndex: toIndex
  });
}

/**
 * Enqueues removing an element at an index.
 *
 * @param {string} parentID ID of the parent component.
 * @param {number} fromIndex Index of the element to remove.
 * @private
 */
function enqueueRemove(parentID, fromIndex) {
  // NOTE: Null values reduce hidden classes.
  updateQueue.push({
    parentID: parentID,
    parentNode: null,
    type: ReactMultiChildUpdateTypes.REMOVE_NODE,
    markupIndex: null,
    textContent: null,
    fromIndex: fromIndex,
    toIndex: null
  });
}

/**
 * Enqueues setting the text content.
 *
 * @param {string} parentID ID of the parent component.
 * @param {string} textContent Text content to set.
 * @private
 */
function enqueueTextContent(parentID, textContent) {
  // NOTE: Null values reduce hidden classes.
  updateQueue.push({
    parentID: parentID,
    parentNode: null,
    type: ReactMultiChildUpdateTypes.TEXT_CONTENT,
    markupIndex: null,
    textContent: textContent,
    fromIndex: null,
    toIndex: null
  });
}

/**
 * Processes any enqueued updates.
 *
 * @private
 */
function processQueue() {
  if (updateQueue.length) {
    ReactComponent.DOMIDOperations.dangerouslyProcessChildrenUpdates(
      updateQueue,
      markupQueue
    );
    clearQueue();
  }
}

/**
 * Clears any enqueued updates.
 *
 * @private
 */
function clearQueue() {
  updateQueue.length = 0;
  markupQueue.length = 0;
}

/**
 * ReactMultiChild are capable of reconciling multiple children.
 *
 * @class ReactMultiChild
 * @internal
 */
var ReactMultiChild = {

  /**
   * Provides common functionality for components that must reconcile multiple
   * children. This is used by `ReactNativeComponent` to mount, update, and
   * unmount child components.
   *
   * @lends {ReactMultiChild.prototype}
   */
  Mixin: {

    /**
     * Generates a "mount image" for each of the supplied children. In the case
     * of `ReactNativeComponent`, a mount image is a string of markup.
     *
     * @param {?object} children As returned by `flattenChildren`.
     * @return {array} An array of mounted representations.
     * @internal
     */
    mountChildren: function(children, transaction) {
      var mountImages = [];
      var index = 0;
      for (var name in children) {
        var child = children[name];
        if (children.hasOwnProperty(name) && child) {
          // Inlined for performance, see `ReactInstanceHandles.createReactID`.
          var rootID = this._rootNodeID + '.' + name;
          var mountImage = child.mountComponent(rootID, transaction);
          child._mountImage = mountImage;
          child._mountIndex = index;
          mountImages.push(mountImage);
          index++;
        }
      }
      this._renderedChildren = children;
      return mountImages;
    },

    /**
     * Replaces any rendered children with a text content string.
     *
     * @param {string} nextContent String of content.
     * @internal
     */
    updateTextContent: function(nextContent) {
      updateDepth++;
      try {
        var prevChildren = this._renderedChildren;
        // Remove any rendered children.
        for (var name in prevChildren) {
          if (prevChildren.hasOwnProperty(name) &&
              prevChildren[name]) {
            this._unmountChildByName(prevChildren[name], name);
          }
        }
        // Set new text content.
        this.setTextContent(nextContent);
      } catch (error) {
        updateDepth--;
        updateDepth || clearQueue();
        throw error;
      }
      updateDepth--;
      updateDepth || processQueue();
    },

    /**
     * Updates the rendered children with new children.
     *
     * @param {?object} nextChildren As returned by `flattenChildren`.
     * @param {ReactReconcileTransaction} transaction
     * @internal
     */
    updateChildren: function(nextChildren, transaction) {
      updateDepth++;
      try {
        this._updateChildren(nextChildren, transaction);
      } catch (error) {
        updateDepth--;
        updateDepth || clearQueue();
        throw error;
      }
      updateDepth--;
      updateDepth || processQueue();
    },

    /**
     * Improve performance by isolating this hot code path from the try/catch
     * block in `updateChildren`.
     *
     * @param {?object} nextChildren As returned by `flattenChildren`.
     * @param {ReactReconcileTransaction} transaction
     * @final
     * @protected
     */
    _updateChildren: function(nextChildren, transaction) {
      var prevChildren = this._renderedChildren;
      if (!nextChildren && !prevChildren) {
        return;
      }
      var name;
      // `nextIndex` will increment for each child in `nextChildren`, but
      // `lastIndex` will be the last index visited in `prevChildren`.
      var lastIndex = 0;
      var nextIndex = 0;
      for (name in nextChildren) {
        if (!nextChildren.hasOwnProperty(name)) {
          continue;
        }
        var prevChild = prevChildren && prevChildren[name];
        var nextChild = nextChildren[name];
        if (shouldUpdateChild(prevChild, nextChild)) {
          this.moveChild(prevChild, nextIndex, lastIndex);
          lastIndex = Math.max(prevChild._mountIndex, lastIndex);
          prevChild.receiveProps(nextChild.props, transaction);
          prevChild._mountIndex = nextIndex;
        } else {
          if (prevChild) {
            // Update `lastIndex` before `_mountIndex` gets unset by unmounting.
            lastIndex = Math.max(prevChild._mountIndex, lastIndex);
            this._unmountChildByName(prevChild, name);
          }
          if (nextChild) {
            this._mountChildByNameAtIndex(
              nextChild, name, nextIndex, transaction
            );
          }
        }
        if (nextChild) {
          nextIndex++;
        }
      }
      // Remove children that are no longer present.
      for (name in prevChildren) {
        if (prevChildren.hasOwnProperty(name) &&
            prevChildren[name] &&
            !(nextChildren && nextChildren[name])) {
          this._unmountChildByName(prevChildren[name], name);
        }
      }
    },

    /**
     * Unmounts all rendered children. This should be used to clean up children
     * when this component is unmounted.
     *
     * @internal
     */
    unmountChildren: function() {
      var renderedChildren = this._renderedChildren;
      for (var name in renderedChildren) {
        var renderedChild = renderedChildren[name];
        if (renderedChild && renderedChild.unmountComponent) {
          renderedChild.unmountComponent();
        }
      }
      this._renderedChildren = null;
    },

    /**
     * Moves a child component to the supplied index.
     *
     * @param {ReactComponent} child Component to move.
     * @param {number} toIndex Destination index of the element.
     * @param {number} lastIndex Last index visited of the siblings of `child`.
     * @protected
     */
    moveChild: function(child, toIndex, lastIndex) {
      // If the index of `child` is less than `lastIndex`, then it needs to
      // be moved. Otherwise, we do not need to move it because a child will be
      // inserted or moved before `child`.
      if (child._mountIndex < lastIndex) {
        enqueueMove(this._rootNodeID, child._mountIndex, toIndex);
      }
    },

    /**
     * Creates a child component.
     *
     * @param {ReactComponent} child Component to create.
     * @protected
     */
    createChild: function(child) {
      enqueueMarkup(this._rootNodeID, child._mountImage, child._mountIndex);
    },

    /**
     * Removes a child component.
     *
     * @param {ReactComponent} child Child to remove.
     * @protected
     */
    removeChild: function(child) {
      enqueueRemove(this._rootNodeID, child._mountIndex);
    },

    /**
     * Sets this text content string.
     *
     * @param {string} textContent Text content to set.
     * @protected
     */
    setTextContent: function(textContent) {
      enqueueTextContent(this._rootNodeID, textContent);
    },

    /**
     * Mounts a child with the supplied name.
     *
     * NOTE: This is part of `updateChildren` and is here for readability.
     *
     * @param {ReactComponent} child Component to mount.
     * @param {string} name Name of the child.
     * @param {number} index Index at which to insert the child.
     * @param {ReactReconcileTransaction} transaction
     * @private
     */
    _mountChildByNameAtIndex: function(child, name, index, transaction) {
      // Inlined for performance, see `ReactInstanceHandles.createReactID`.
      var rootID = this._rootNodeID + '.' + name;
      var mountImage = child.mountComponent(rootID, transaction);
      child._mountImage = mountImage;
      child._mountIndex = index;
      this.createChild(child);
      this._renderedChildren = this._renderedChildren || {};
      this._renderedChildren[name] = child;
    },

    /**
     * Unmounts a rendered child by name.
     *
     * NOTE: This is part of `updateChildren` and is here for readability.
     *
     * @param {ReactComponent} child Component to unmount.
     * @param {string} name Name of the child in `this._renderedChildren`.
     * @private
     */
    _unmountChildByName: function(child, name) {
      if (ReactComponent.isValidComponent(child)) {
        this.removeChild(child);
        child._mountImage = null;
        child._mountIndex = null;
        child.unmountComponent();
        delete this._renderedChildren[name];
      }
    }

  }

};

module.exports = ReactMultiChild;

},{"./ReactComponent":"RDDX+O","./ReactMultiChildUpdateTypes":"1fqbih"}],"1fqbih":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactMultiChildUpdateTypes
 */

var keyMirror = require("./keyMirror");

/**
 * When a component's children are updated, a series of update configuration
 * objects are created in order to batch and serialize the required changes.
 *
 * Enumerates all the possible types of update configurations.
 *
 * @internal
 */
var ReactMultiChildUpdateTypes = keyMirror({
  INSERT_MARKUP: null,
  MOVE_EXISTING: null,
  REMOVE_NODE: null,
  TEXT_CONTENT: null
});

module.exports = ReactMultiChildUpdateTypes;

},{"./keyMirror":"n1FgJb"}],"g13zJS":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactNativeComponent
 * @typechecks static-only
 */

"use strict";

var CSSPropertyOperations = require("./CSSPropertyOperations");
var DOMProperty = require("./DOMProperty");
var DOMPropertyOperations = require("./DOMPropertyOperations");
var ReactComponent = require("./ReactComponent");
var ReactEventEmitter = require("./ReactEventEmitter");
var ReactMultiChild = require("./ReactMultiChild");
var ReactMount = require("./ReactMount");
var ReactPerf = require("./ReactPerf");

var escapeTextForBrowser = require("./escapeTextForBrowser");
var flattenChildren = require("./flattenChildren");
var invariant = require("./invariant");
var keyOf = require("./keyOf");
var merge = require("./merge");
var mixInto = require("./mixInto");

var putListener = ReactEventEmitter.putListener;
var deleteListener = ReactEventEmitter.deleteListener;
var registrationNames = ReactEventEmitter.registrationNames;

// For quickly matching children type, to test if can be treated as content.
var CONTENT_TYPES = {'string': true, 'number': true};

var DANGEROUSLY_SET_INNER_HTML = keyOf({dangerouslySetInnerHTML: null});
var STYLE = keyOf({style: null});

/**
 * @param {?object} props
 */
function assertValidProps(props) {
  if (!props) {
    return;
  }
  // Note the use of `==` which checks for null or undefined.
  invariant(props.children == null || props.dangerouslySetInnerHTML == null);
  invariant(props.style == null || typeof props.style === 'object');
}

/**
 * @constructor ReactNativeComponent
 * @extends ReactComponent
 * @extends ReactMultiChild
 */
function ReactNativeComponent(tag, omitClose) {
  this._tagOpen = '<' + tag;
  this._tagClose = omitClose ? '' : '</' + tag + '>';
  this.tagName = tag.toUpperCase();
}

ReactNativeComponent.Mixin = {

  /**
   * Generates root tag markup then recurses. This method has side effects and
   * is not idempotent.
   *
   * @internal
   * @param {string} rootID The root DOM ID for this node.
   * @param {ReactReconcileTransaction} transaction
   * @return {string} The computed markup.
   */
  mountComponent: ReactPerf.measure(
    'ReactNativeComponent',
    'mountComponent',
    function(rootID, transaction) {
      ReactComponent.Mixin.mountComponent.call(this, rootID, transaction);
      assertValidProps(this.props);
      return (
        this._createOpenTagMarkup() +
        this._createContentMarkup(transaction) +
        this._tagClose
      );
    }
  ),

  /**
   * Creates markup for the open tag and all attributes.
   *
   * This method has side effects because events get registered.
   *
   * Iterating over object properties is faster than iterating over arrays.
   * @see http://jsperf.com/obj-vs-arr-iteration
   *
   * @private
   * @return {string} Markup of opening tag.
   */
  _createOpenTagMarkup: function() {
    var props = this.props;
    var ret = this._tagOpen;

    for (var propKey in props) {
      if (!props.hasOwnProperty(propKey)) {
        continue;
      }
      var propValue = props[propKey];
      if (propValue == null) {
        continue;
      }
      if (registrationNames[propKey]) {
        putListener(this._rootNodeID, propKey, propValue);
      } else {
        if (propKey === STYLE) {
          if (propValue) {
            propValue = props.style = merge(props.style);
          }
          propValue = CSSPropertyOperations.createMarkupForStyles(propValue);
        }
        var markup =
          DOMPropertyOperations.createMarkupForProperty(propKey, propValue);
        if (markup) {
          ret += ' ' + markup;
        }
      }
    }

    var escapedID = escapeTextForBrowser(this._rootNodeID);
    return ret + ' ' + ReactMount.ATTR_NAME + '="' + escapedID + '">';
  },

  /**
   * Creates markup for the content between the tags.
   *
   * @private
   * @param {ReactReconcileTransaction} transaction
   * @return {string} Content markup.
   */
  _createContentMarkup: function(transaction) {
    // Intentional use of != to avoid catching zero/false.
    var innerHTML = this.props.dangerouslySetInnerHTML;
    if (innerHTML != null) {
      if (innerHTML.__html != null) {
        return innerHTML.__html;
      }
    } else {
      var contentToUse =
        CONTENT_TYPES[typeof this.props.children] ? this.props.children : null;
      var childrenToUse = contentToUse != null ? null : this.props.children;
      if (contentToUse != null) {
        return escapeTextForBrowser(contentToUse);
      } else if (childrenToUse != null) {
        var mountImages = this.mountChildren(
          flattenChildren(childrenToUse),
          transaction
        );
        return mountImages.join('');
      }
    }
    return '';
  },

  receiveProps: function(nextProps, transaction) {
    assertValidProps(nextProps);
    ReactComponent.Mixin.receiveProps.call(this, nextProps, transaction);
  },

  /**
   * Updates a native DOM component after it has already been allocated and
   * attached to the DOM. Reconciles the root DOM node, then recurses.
   *
   * @param {ReactReconcileTransaction} transaction
   * @param {object} prevProps
   * @internal
   * @overridable
   */
  updateComponent: ReactPerf.measure(
    'ReactNativeComponent',
    'updateComponent',
    function(transaction, prevProps) {
      ReactComponent.Mixin.updateComponent.call(this, transaction, prevProps);
      this._updateDOMProperties(prevProps);
      this._updateDOMChildren(prevProps, transaction);
    }
  ),

  /**
   * Reconciles the properties by detecting differences in property values and
   * updating the DOM as necessary. This function is probably the single most
   * critical path for performance optimization.
   *
   * TODO: Benchmark whether checking for changed values in memory actually
   *       improves performance (especially statically positioned elements).
   * TODO: Benchmark the effects of putting this at the top since 99% of props
   *       do not change for a given reconciliation.
   * TODO: Benchmark areas that can be improved with caching.
   *
   * @private
   * @param {object} lastProps
   */
  _updateDOMProperties: function(lastProps) {
    var nextProps = this.props;
    var propKey;
    var styleName;
    var styleUpdates;
    for (propKey in lastProps) {
      if (nextProps.hasOwnProperty(propKey) ||
         !lastProps.hasOwnProperty(propKey)) {
        continue;
      }
      if (propKey === STYLE) {
        var lastStyle = lastProps[propKey];
        for (styleName in lastStyle) {
          if (lastStyle.hasOwnProperty(styleName)) {
            styleUpdates = styleUpdates || {};
            styleUpdates[styleName] = '';
          }
        }
      } else if (propKey === DANGEROUSLY_SET_INNER_HTML) {
        // http://jsperf.com/emptying-speed
        ReactComponent.DOMIDOperations.updateTextContentByID(
          this._rootNodeID,
          ''
        );
      } else if (registrationNames[propKey]) {
        deleteListener(this._rootNodeID, propKey);
      } else {
        ReactComponent.DOMIDOperations.deletePropertyByID(
          this._rootNodeID,
          propKey
        );
      }
    }
    for (propKey in nextProps) {
      var nextProp = nextProps[propKey];
      var lastProp = lastProps[propKey];
      if (!nextProps.hasOwnProperty(propKey) || nextProp === lastProp) {
        continue;
      }
      if (propKey === STYLE) {
        if (nextProp) {
          nextProp = nextProps.style = merge(nextProp);
        }
        if (lastProp) {
          // Unset styles on `lastProp` but not on `nextProp`.
          for (styleName in lastProp) {
            if (lastProp.hasOwnProperty(styleName) &&
                !nextProp.hasOwnProperty(styleName)) {
              styleUpdates = styleUpdates || {};
              styleUpdates[styleName] = '';
            }
          }
          // Update styles that changed since `lastProp`.
          for (styleName in nextProp) {
            if (nextProp.hasOwnProperty(styleName) &&
                lastProp[styleName] !== nextProp[styleName]) {
              styleUpdates = styleUpdates || {};
              styleUpdates[styleName] = nextProp[styleName];
            }
          }
        } else {
          // Relies on `updateStylesByID` not mutating `styleUpdates`.
          styleUpdates = nextProp;
        }
      } else if (propKey === DANGEROUSLY_SET_INNER_HTML) {
        var lastHtml = lastProp && lastProp.__html;
        var nextHtml = nextProp && nextProp.__html;
        if (lastHtml !== nextHtml) {
          ReactComponent.DOMIDOperations.updateInnerHTMLByID(
            this._rootNodeID,
            nextProp
          );
        }
      } else if (registrationNames[propKey]) {
        putListener(this._rootNodeID, propKey, nextProp);
      } else if (
          DOMProperty.isStandardName[propKey] ||
          DOMProperty.isCustomAttribute(propKey)) {
        ReactComponent.DOMIDOperations.updatePropertyByID(
          this._rootNodeID,
          propKey,
          nextProp
        );
      }
    }
    if (styleUpdates) {
      ReactComponent.DOMIDOperations.updateStylesByID(
        this._rootNodeID,
        styleUpdates
      );
    }
  },

  /**
   * Reconciles the children with the various properties that affect the
   * children content.
   *
   * @param {object} lastProps
   * @param {ReactReconcileTransaction} transaction
   */
  _updateDOMChildren: function(lastProps, transaction) {
    var nextProps = this.props;

    var lastUsedContent =
      CONTENT_TYPES[typeof lastProps.children] ? lastProps.children : null;
    var contentToUse =
      CONTENT_TYPES[typeof nextProps.children] ? nextProps.children : null;

    // Note the use of `!=` which checks for null or undefined.

    var lastUsedChildren =
      lastUsedContent != null ? null : lastProps.children;
    var childrenToUse = contentToUse != null ? null : nextProps.children;

    if (contentToUse != null) {
      var childrenRemoved = lastUsedChildren != null && childrenToUse == null;
      if (childrenRemoved) {
        this.updateChildren(null, transaction);
      }
      if (lastUsedContent !== contentToUse) {
        this.updateTextContent('' + contentToUse);
      }
    } else {
      var contentRemoved = lastUsedContent != null && contentToUse == null;
      if (contentRemoved) {
        this.updateTextContent('');
      }
      this.updateChildren(flattenChildren(nextProps.children), transaction);
    }
  },

  /**
   * Destroys all event registrations for this instance. Does not remove from
   * the DOM. That must be done by the parent.
   *
   * @internal
   */
  unmountComponent: function() {
    ReactEventEmitter.deleteAllListeners(this._rootNodeID);
    ReactComponent.Mixin.unmountComponent.call(this);
    this.unmountChildren();
  }

};

mixInto(ReactNativeComponent, ReactComponent.Mixin);
mixInto(ReactNativeComponent, ReactNativeComponent.Mixin);
mixInto(ReactNativeComponent, ReactMultiChild.Mixin);

module.exports = ReactNativeComponent;

},{"./CSSPropertyOperations":"BlPn6+","./DOMProperty":"fduHX3","./DOMPropertyOperations":"n+MrOf","./ReactComponent":"RDDX+O","./ReactEventEmitter":"qPIJ8M","./ReactMount":"1R+7Eu","./ReactMultiChild":"UlnLr0","./ReactPerf":"S6hUyz","./escapeTextForBrowser":"ZaIegL","./flattenChildren":"cza1WC","./invariant":"hPxNWC","./keyOf":"Q4rOoG","./merge":"7duoWY","./mixInto":"qzQld6"}],"rkZBuo":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactOnDOMReady
 */

"use strict";

var PooledClass = require("./PooledClass");

var mixInto = require("./mixInto");

/**
 * A specialized pseudo-event module to help keep track of components waiting to
 * be notified when their DOM representations are available for use.
 *
 * This implements `PooledClass`, so you should never need to instantiate this.
 * Instead, use `ReactOnDOMReady.getPooled()`.
 *
 * @param {?array<function>} initialCollection
 * @class ReactOnDOMReady
 * @implements PooledClass
 * @internal
 */
function ReactOnDOMReady(initialCollection) {
  this._queue = initialCollection || null;
}

mixInto(ReactOnDOMReady, {

  /**
   * Enqueues a callback to be invoked when `notifyAll` is invoked. This is used
   * to enqueue calls to `componentDidMount` and `componentDidUpdate`.
   *
   * @param {ReactComponent} component Component being rendered.
   * @param {function(DOMElement)} callback Invoked when `notifyAll` is invoked.
   * @internal
   */
  enqueue: function(component, callback) {
    this._queue = this._queue || [];
    this._queue.push({component: component, callback: callback});
  },

  /**
   * Invokes all enqueued callbacks and clears the queue. This is invoked after
   * the DOM representation of a component has been created or updated.
   *
   * @internal
   */
  notifyAll: function() {
    var queue = this._queue;
    if (queue) {
      this._queue = null;
      for (var i = 0, l = queue.length; i < l; i++) {
        var component = queue[i].component;
        var callback = queue[i].callback;
        callback.call(component, component.getDOMNode());
      }
      queue.length = 0;
    }
  },

  /**
   * Resets the internal queue.
   *
   * @internal
   */
  reset: function() {
    this._queue = null;
  },

  /**
   * `PooledClass` looks for this.
   */
  destructor: function() {
    this.reset();
  }

});

PooledClass.addPoolingTo(ReactOnDOMReady);

module.exports = ReactOnDOMReady;

},{"./PooledClass":"5mz1Gs","./mixInto":"qzQld6"}],"YwelYh":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactOwner
 */

"use strict";

var invariant = require("./invariant");

/**
 * ReactOwners are capable of storing references to owned components.
 *
 * All components are capable of //being// referenced by owner components, but
 * only ReactOwner components are capable of //referencing// owned components.
 * The named reference is known as a "ref".
 *
 * Refs are available when mounted and updated during reconciliation.
 *
 *   var MyComponent = React.createClass({
 *     render: function() {
 *       return (
 *         <div onClick={this.handleClick}>
 *           <CustomComponent ref="custom" />
 *         </div>
 *       );
 *     },
 *     handleClick: function() {
 *       this.refs.custom.handleClick();
 *     },
 *     componentDidMount: function() {
 *       this.refs.custom.initialize();
 *     }
 *   });
 *
 * Refs should rarely be used. When refs are used, they should only be done to
 * control data that is not handled by React's data flow.
 *
 * @class ReactOwner
 */
var ReactOwner = {

  /**
   * @param {?object} object
   * @return {boolean} True if `object` is a valid owner.
   * @final
   */
  isValidOwner: function(object) {
    return !!(
      object &&
      typeof object.attachRef === 'function' &&
      typeof object.detachRef === 'function'
    );
  },

  /**
   * Adds a component by ref to an owner component.
   *
   * @param {ReactComponent} component Component to reference.
   * @param {string} ref Name by which to refer to the component.
   * @param {ReactOwner} owner Component on which to record the ref.
   * @final
   * @internal
   */
  addComponentAsRefTo: function(component, ref, owner) {
    invariant(ReactOwner.isValidOwner(owner));
    owner.attachRef(ref, component);
  },

  /**
   * Removes a component by ref from an owner component.
   *
   * @param {ReactComponent} component Component to dereference.
   * @param {string} ref Name of the ref to remove.
   * @param {ReactOwner} owner Component on which the ref is recorded.
   * @final
   * @internal
   */
  removeComponentAsRefFrom: function(component, ref, owner) {
    invariant(ReactOwner.isValidOwner(owner));
    // Check that `component` is still the current ref because we do not want to
    // detach the ref if another component stole it.
    if (owner.refs[ref] === component) {
      owner.detachRef(ref);
    }
  },

  /**
   * A ReactComponent must mix this in to have refs.
   *
   * @lends {ReactOwner.prototype}
   */
  Mixin: {

    /**
     * Lazily allocates the refs object and stores `component` as `ref`.
     *
     * @param {string} ref Reference name.
     * @param {component} component Component to store as `ref`.
     * @final
     * @private
     */
    attachRef: function(ref, component) {
      invariant(component.isOwnedBy(this));
      var refs = this.refs || (this.refs = {});
      refs[ref] = component;
    },

    /**
     * Detaches a reference name.
     *
     * @param {string} ref Name to dereference.
     * @final
     * @private
     */
    detachRef: function(ref) {
      delete this.refs[ref];
    }

  }

};

module.exports = ReactOwner;

},{"./invariant":"hPxNWC"}],"S6hUyz":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactPerf
 * @typechecks static-only
 */

"use strict";

var ReactPerf = {
  /**
   * Boolean to enable/disable measurement. Set to false by default to prevent
   * accidental logging and perf loss.
   */
  enableMeasure: false,

  /**
   * Holds onto the measure function in use. By default, don't measure
   * anything, but we'll override this if we inject a measure function.
   */
  storedMeasure: _noMeasure,

  /**
   * Use this to wrap methods you want to measure.
   *
   * @param {string} objName
   * @param {string} fnName
   * @param {function} func
   * @return {function}
   */
  measure: function(objName, fnName, func) {
      return func;
  },

  injection: {
    /**
     * @param {function} measure
     */
    injectMeasure: function(measure) {
      ReactPerf.storedMeasure = measure;
    }
  }
};

/**
 * Simply passes through the measured function, without measuring it.
 *
 * @param {string} objName
 * @param {string} fnName
 * @param {function} func
 * @return {function}
 */
function _noMeasure(objName, fnName, func) {
  return func;
}

module.exports = ReactPerf;

},{}],"K6UoEF":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactPropTransferer
 */

"use strict";

var emptyFunction = require("./emptyFunction");
var joinClasses = require("./joinClasses");
var merge = require("./merge");

/**
 * Creates a transfer strategy that will merge prop values using the supplied
 * `mergeStrategy`. If a prop was previously unset, this just sets it.
 *
 * @param {function} mergeStrategy
 * @return {function}
 */
function createTransferStrategy(mergeStrategy) {
  return function(props, key, value) {
    if (!props.hasOwnProperty(key)) {
      props[key] = value;
    } else {
      props[key] = mergeStrategy(props[key], value);
    }
  };
}

/**
 * Transfer strategies dictate how props are transferred by `transferPropsTo`.
 */
var TransferStrategies = {
  /**
   * Never transfer `children`.
   */
  children: emptyFunction,
  /**
   * Transfer the `className` prop by merging them.
   */
  className: createTransferStrategy(joinClasses),
  /**
   * Never transfer the `ref` prop.
   */
  ref: emptyFunction,
  /**
   * Transfer the `style` prop (which is an object) by merging them.
   */
  style: createTransferStrategy(merge)
};

/**
 * ReactPropTransferer are capable of transferring props to another component
 * using a `transferPropsTo` method.
 *
 * @class ReactPropTransferer
 */
var ReactPropTransferer = {

  TransferStrategies: TransferStrategies,

  /**
   * @lends {ReactPropTransferer.prototype}
   */
  Mixin: {

    /**
     * Transfer props from this component to a target component.
     *
     * Props that do not have an explicit transfer strategy will be transferred
     * only if the target component does not already have the prop set.
     *
     * This is usually used to pass down props to a returned root component.
     *
     * @param {ReactComponent} component Component receiving the properties.
     * @return {ReactComponent} The supplied `component`.
     * @final
     * @protected
     */
    transferPropsTo: function(component) {
      var props = {};
      for (var thatKey in component.props) {
        if (component.props.hasOwnProperty(thatKey)) {
          props[thatKey] = component.props[thatKey];
        }
      }
      for (var thisKey in this.props) {
        if (!this.props.hasOwnProperty(thisKey)) {
          continue;
        }
        var transferStrategy = TransferStrategies[thisKey];
        if (transferStrategy) {
          transferStrategy(props, thisKey, this.props[thisKey]);
        } else if (!props.hasOwnProperty(thisKey)) {
          props[thisKey] = this.props[thisKey];
        }
      }
      component.props = props;
      return component;
    }

  }

};

module.exports = ReactPropTransferer;

},{"./emptyFunction":"RxjlFd","./joinClasses":"odpU/7","./merge":"7duoWY"}],"9axgbZ":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactPropTypes
 */

"use strict";

var createObjectFrom = require("./createObjectFrom");
var invariant = require("./invariant");

/**
 * Collection of methods that allow declaration and validation of props that are
 * supplied to React components. Example usage:
 *
 *   var Props = require('ReactPropTypes');
 *   var MyArticle = React.createClass({
 *     propTypes: {
 *       // An optional string prop named "description".
 *       description: Props.string,
 *
 *       // A required enum prop named "category".
 *       category: Props.oneOf(['News','Photos']).isRequired,
 *
 *       // A prop named "dialog" that requires an instance of Dialog.
 *       dialog: Props.instanceOf(Dialog).isRequired
 *     },
 *     render: function() { ... }
 *   });
 *
 * A more formal specification of how these methods are used:
 *
 *   type := array|bool|object|number|string|oneOf([...])|instanceOf(...)
 *   decl := ReactPropTypes.{type}(.isRequired)?
 *
 * Each and every declaration produces a function with the same signature. This
 * allows the creation of custom validation functions. For example:
 *
 *   var Props = require('ReactPropTypes');
 *   var MyLink = React.createClass({
 *     propTypes: {
 *       // An optional string or URI prop named "href".
 *       href: function(props, propName, componentName) {
 *         var propValue = props[propName];
 *         invariant(
 *           propValue == null ||
 *           typeof propValue === string ||
 *           propValue instanceof URI,
 *           'Invalid `%s` supplied to `%s`, expected string or URI.',
 *           propName,
 *           componentName
 *         );
 *       }
 *     },
 *     render: function() { ... }
 *   });
 *
 * @internal
 */
var Props = {

  array: createPrimitiveTypeChecker('array'),
  bool: createPrimitiveTypeChecker('boolean'),
  func: createPrimitiveTypeChecker('function'),
  number: createPrimitiveTypeChecker('number'),
  object: createPrimitiveTypeChecker('object'),
  string: createPrimitiveTypeChecker('string'),

  oneOf: createEnumTypeChecker,

  instanceOf: createInstanceTypeChecker

};

var ANONYMOUS = '<<anonymous>>';

function createPrimitiveTypeChecker(expectedType) {
  function validatePrimitiveType(propValue, propName, componentName) {
    var propType = typeof propValue;
    if (propType === 'object' && Array.isArray(propValue)) {
      propType = 'array';
    }
    invariant(propType === expectedType);
  }
  return createChainableTypeChecker(validatePrimitiveType);
}

function createEnumTypeChecker(expectedValues) {
  var expectedEnum = createObjectFrom(expectedValues);
  function validateEnumType(propValue, propName, componentName) {
    invariant(expectedEnum[propValue]);
  }
  return createChainableTypeChecker(validateEnumType);
}

function createInstanceTypeChecker(expectedClass) {
  function validateInstanceType(propValue, propName, componentName) {
    invariant(propValue instanceof expectedClass);
  }
  return createChainableTypeChecker(validateInstanceType);
}

function createChainableTypeChecker(validate) {
  function createTypeChecker(isRequired) {
    function checkType(props, propName, componentName) {
      var propValue = props[propName];
      if (propValue != null) {
        // Only validate if there is a value to check.
        validate(propValue, propName, componentName || ANONYMOUS);
      } else {
        invariant(!isRequired);
      }
    }
    if (!isRequired) {
      checkType.isRequired = createTypeChecker(true);
    }
    return checkType;
  }
  return createTypeChecker(false);
}

module.exports = Props;

},{"./createObjectFrom":"OocYg9","./invariant":"hPxNWC"}],"38o64s":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactReconcileTransaction
 * @typechecks static-only
 */

"use strict";

var ExecutionEnvironment = require("./ExecutionEnvironment");
var PooledClass = require("./PooledClass");
var ReactEventEmitter = require("./ReactEventEmitter");
var ReactInputSelection = require("./ReactInputSelection");
var ReactOnDOMReady = require("./ReactOnDOMReady");
var Transaction = require("./Transaction");

var mixInto = require("./mixInto");

/**
 * Ensures that, when possible, the selection range (currently selected text
 * input) is not disturbed by performing the transaction.
 */
var SELECTION_RESTORATION = {
  /**
   * @return {Selection} Selection information.
   */
  initialize: ReactInputSelection.getSelectionInformation,
  /**
   * @param {Selection} sel Selection information returned from `initialize`.
   */
  close: ReactInputSelection.restoreSelection
};

/**
 * Suppresses events (blur/focus) that could be inadvertently dispatched due to
 * high level DOM manipulations (like temporarily removing a text input from the
 * DOM).
 */
var EVENT_SUPPRESSION = {
  /**
   * @return {boolean} The enabled status of `ReactEventEmitter` before the
   * reconciliation.
   */
  initialize: function() {
    var currentlyEnabled = ReactEventEmitter.isEnabled();
    ReactEventEmitter.setEnabled(false);
    return currentlyEnabled;
  },

  /**
   * @param {boolean} previouslyEnabled Enabled status of `ReactEventEmitter`
   *   before the reconciliation occured. `close` restores the previous value.
   */
  close: function(previouslyEnabled) {
    ReactEventEmitter.setEnabled(previouslyEnabled);
  }
};

/**
 * Provides a `ReactOnDOMReady` queue for collecting `onDOMReady` callbacks
 * during the performing of the transaction.
 */
var ON_DOM_READY_QUEUEING = {
  /**
   * Initializes the internal `onDOMReady` queue.
   */
  initialize: function() {
    this.reactOnDOMReady.reset();
  },

  /**
   * After DOM is flushed, invoke all registered `onDOMReady` callbacks.
   */
  close: function() {
    this.reactOnDOMReady.notifyAll();
  }
};

/**
 * Executed within the scope of the `Transaction` instance. Consider these as
 * being member methods, but with an implied ordering while being isolated from
 * each other.
 */
var TRANSACTION_WRAPPERS = [
  SELECTION_RESTORATION,
  EVENT_SUPPRESSION,
  ON_DOM_READY_QUEUEING
];

/**
 * Currently:
 * - The order that these are listed in the transaction is critical:
 * - Suppresses events.
 * - Restores selection range.
 *
 * Future:
 * - Restore document/overflow scroll positions that were unintentionally
 *   modified via DOM insertions above the top viewport boundary.
 * - Implement/integrate with customized constraint based layout system and keep
 *   track of which dimensions must be remeasured.
 *
 * @class ReactReconcileTransaction
 */
function ReactReconcileTransaction() {
  this.reinitializeTransaction();
  this.reactOnDOMReady = ReactOnDOMReady.getPooled(null);
}

var Mixin = {
  /**
   * @see Transaction
   * @abstract
   * @final
   * @return {array<object>} List of operation wrap proceedures.
   *   TODO: convert to array<TransactionWrapper>
   */
  getTransactionWrappers: function() {
    if (ExecutionEnvironment.canUseDOM) {
      return TRANSACTION_WRAPPERS;
    } else {
      return [];
    }
  },

  /**
   * @return {object} The queue to collect `onDOMReady` callbacks with.
   *   TODO: convert to ReactOnDOMReady
   */
  getReactOnDOMReady: function() {
    return this.reactOnDOMReady;
  },

  /**
   * `PooledClass` looks for this, and will invoke this before allowing this
   * instance to be resused.
   */
  destructor: function() {
    ReactOnDOMReady.release(this.reactOnDOMReady);
    this.reactOnDOMReady = null;
  }
};


mixInto(ReactReconcileTransaction, Transaction.Mixin);
mixInto(ReactReconcileTransaction, Mixin);

PooledClass.addPoolingTo(ReactReconcileTransaction);

module.exports = ReactReconcileTransaction;

},{"./ExecutionEnvironment":"mrmvk9","./PooledClass":"5mz1Gs","./ReactEventEmitter":"qPIJ8M","./ReactInputSelection":"eT7xLu","./ReactOnDOMReady":"rkZBuo","./Transaction":"aekoY0","./mixInto":"qzQld6"}],"JvdSDI":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @typechecks static-only
 * @providesModule ReactServerRendering
 */
"use strict";

var ReactMarkupChecksum = require("./ReactMarkupChecksum");
var ReactReconcileTransaction = require("./ReactReconcileTransaction");
var ReactInstanceHandles = require("./ReactInstanceHandles");

/**
 * @param {object} component
 * @param {function} callback
 */
function renderComponentToString(component, callback) {
  // We use a callback API to keep the API async in case in the future we ever
  // need it, but in reality this is a synchronous operation.
  var id = ReactInstanceHandles.createReactRootID();
  var transaction = ReactReconcileTransaction.getPooled();
  transaction.reinitializeTransaction();
  try {
    transaction.perform(function() {
      var markup = component.mountComponent(id, transaction);
      markup = ReactMarkupChecksum.addChecksumToMarkup(markup);
      callback(markup);
    }, null);
  } finally {
    ReactReconcileTransaction.release(transaction);
  }
}

module.exports = {
  renderComponentToString: renderComponentToString
};

},{"./ReactInstanceHandles":"owd960","./ReactMarkupChecksum":"TUHHsM","./ReactReconcileTransaction":"38o64s"}],"/gjL2v":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactTextComponent
 * @typechecks static-only
 */

"use strict";

var ReactComponent = require("./ReactComponent");
var ReactMount = require("./ReactMount");

var escapeTextForBrowser = require("./escapeTextForBrowser");
var mixInto = require("./mixInto");

/**
 * Text nodes violate a couple assumptions that React makes about components:
 *
 *  - When mounting text into the DOM, adjacent text nodes are merged.
 *  - Text nodes cannot be assigned a React root ID.
 *
 * This component is used to wrap strings in elements so that they can undergo
 * the same reconciliation that is applied to elements.
 *
 * TODO: Investigate representing React components in the DOM with text nodes.
 *
 * @class ReactTextComponent
 * @extends ReactComponent
 * @internal
 */
var ReactTextComponent = function(initialText) {
  this.construct({text: initialText});
};

mixInto(ReactTextComponent, ReactComponent.Mixin);
mixInto(ReactTextComponent, {

  /**
   * Creates the markup for this text node. This node is not intended to have
   * any features besides containing text content.
   *
   * @param {string} rootID DOM ID of the root node.
   * @return {string} Markup for this text node.
   * @internal
   */
  mountComponent: function(rootID) {
    ReactComponent.Mixin.mountComponent.call(this, rootID);
    return (
      '<span ' + ReactMount.ATTR_NAME + '="' + rootID + '">' +
        escapeTextForBrowser(this.props.text) +
      '</span>'
    );
  },

  /**
   * Updates this component by updating the text content.
   *
   * @param {object} nextProps Contains the next text content.
   * @param {ReactReconcileTransaction} transaction
   * @internal
   */
  receiveProps: function(nextProps, transaction) {
    if (nextProps.text !== this.props.text) {
      this.props.text = nextProps.text;
      ReactComponent.DOMIDOperations.updateTextContentByID(
        this._rootNodeID,
        nextProps.text
      );
    }
  }

});

module.exports = ReactTextComponent;

},{"./ReactComponent":"RDDX+O","./ReactMount":"1R+7Eu","./escapeTextForBrowser":"ZaIegL","./mixInto":"qzQld6"}],"dwYRw4":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactUpdates
 */

"use strict";

var invariant = require("./invariant");

var dirtyComponents = [];

var batchingStrategy = null;

function ensureBatchingStrategy() {
  invariant(batchingStrategy);
}

function batchedUpdates(callback) {
  ensureBatchingStrategy();
  batchingStrategy.batchedUpdates(callback);
}

function runBatchedUpdates() {
  // TODO: Sort components by depth such that parent components update first
  for (var i = 0; i < dirtyComponents.length; i++) {
    // If a component is unmounted before pending changes apply, ignore them
    // TODO: Queue unmounts in the same list to avoid this happening at all
    var component = dirtyComponents[i];
    if (component.isMounted()) {
      // If performUpdateIfNecessary happens to enqueue any new updates, we
      // shouldn't execute the callbacks until the next render happens, so
      // stash the callbacks first
      var callbacks = component._pendingCallbacks;
      component._pendingCallbacks = null;
      component.performUpdateIfNecessary();
      if (callbacks) {
        for (var j = 0; j < callbacks.length; j++) {
          callbacks[j].call(component);
        }
      }
    }
  }
}

function clearDirtyComponents() {
  dirtyComponents.length = 0;
}

function flushBatchedUpdates() {
  // Run these in separate functions so the JIT can optimize
  try {
    runBatchedUpdates();
  } catch (e) {
    // IE 8 requires catch to use finally.
    throw e;
  } finally {
    clearDirtyComponents();
  }
}

/**
 * Mark a component as needing a rerender, adding an optional callback to a
 * list of functions which will be executed once the rerender occurs.
 */
function enqueueUpdate(component, callback) {
  invariant(!callback || typeof callback === "function");
  ensureBatchingStrategy();

  if (!batchingStrategy.isBatchingUpdates) {
    component.performUpdateIfNecessary();
    callback && callback();
    return;
  }

  dirtyComponents.push(component);

  if (callback) {
    if (component._pendingCallbacks) {
      component._pendingCallbacks.push(callback);
    } else {
      component._pendingCallbacks = [callback];
    }
  }
}

var ReactUpdatesInjection = {
  injectBatchingStrategy: function(_batchingStrategy) {
    invariant(_batchingStrategy);
    invariant(typeof _batchingStrategy.batchedUpdates === 'function');
    invariant(typeof _batchingStrategy.isBatchingUpdates === 'boolean');
    batchingStrategy = _batchingStrategy;
  }
};

var ReactUpdates = {
  batchedUpdates: batchedUpdates,
  enqueueUpdate: enqueueUpdate,
  flushBatchedUpdates: flushBatchedUpdates,
  injection: ReactUpdatesInjection
};

module.exports = ReactUpdates;

},{"./invariant":"hPxNWC"}],"vsWsrL":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule SimpleEventPlugin
 */

"use strict";

var EventConstants = require("./EventConstants");
var EventPropagators = require("./EventPropagators");
var SyntheticEvent = require("./SyntheticEvent");
var SyntheticFocusEvent = require("./SyntheticFocusEvent");
var SyntheticKeyboardEvent = require("./SyntheticKeyboardEvent");
var SyntheticMouseEvent = require("./SyntheticMouseEvent");
var SyntheticMutationEvent = require("./SyntheticMutationEvent");
var SyntheticTouchEvent = require("./SyntheticTouchEvent");
var SyntheticUIEvent = require("./SyntheticUIEvent");
var SyntheticWheelEvent = require("./SyntheticWheelEvent");

var invariant = require("./invariant");
var keyOf = require("./keyOf");

var topLevelTypes = EventConstants.topLevelTypes;

var eventTypes = {
  blur: {
    phasedRegistrationNames: {
      bubbled: keyOf({onBlur: true}),
      captured: keyOf({onBlurCapture: true})
    }
  },
  click: {
    phasedRegistrationNames: {
      bubbled: keyOf({onClick: true}),
      captured: keyOf({onClickCapture: true})
    }
  },
  doubleClick: {
    phasedRegistrationNames: {
      bubbled: keyOf({onDoubleClick: true}),
      captured: keyOf({onDoubleClickCapture: true})
    }
  },
  drag: {
    phasedRegistrationNames: {
      bubbled: keyOf({onDrag: true}),
      captured: keyOf({onDragCapture: true})
    }
  },
  dragEnd: {
    phasedRegistrationNames: {
      bubbled: keyOf({onDragEnd: true}),
      captured: keyOf({onDragEndCapture: true})
    }
  },
  dragEnter: {
    phasedRegistrationNames: {
      bubbled: keyOf({onDragEnter: true}),
      captured: keyOf({onDragEnterCapture: true})
    }
  },
  dragExit: {
    phasedRegistrationNames: {
      bubbled: keyOf({onDragExit: true}),
      captured: keyOf({onDragExitCapture: true})
    }
  },
  dragLeave: {
    phasedRegistrationNames: {
      bubbled: keyOf({onDragLeave: true}),
      captured: keyOf({onDragLeaveCapture: true})
    }
  },
  dragOver: {
    phasedRegistrationNames: {
      bubbled: keyOf({onDragOver: true}),
      captured: keyOf({onDragOverCapture: true})
    }
  },
  dragStart: {
    phasedRegistrationNames: {
      bubbled: keyOf({onDragStart: true}),
      captured: keyOf({onDragStartCapture: true})
    }
  },
  drop: {
    phasedRegistrationNames: {
      bubbled: keyOf({onDrop: true}),
      captured: keyOf({onDropCapture: true})
    }
  },
  DOMCharacterDataModified: {
    phasedRegistrationNames: {
      bubbled: keyOf({onDOMCharacterDataModified: true}),
      captured: keyOf({onDOMCharacterDataModifiedCapture: true})
    }
  },
  focus: {
    phasedRegistrationNames: {
      bubbled: keyOf({onFocus: true}),
      captured: keyOf({onFocusCapture: true})
    }
  },
  input: {
    phasedRegistrationNames: {
      bubbled: keyOf({onInput: true}),
      captured: keyOf({onInputCapture: true})
    }
  },
  keyDown: {
    phasedRegistrationNames: {
      bubbled: keyOf({onKeyDown: true}),
      captured: keyOf({onKeyDownCapture: true})
    }
  },
  keyPress: {
    phasedRegistrationNames: {
      bubbled: keyOf({onKeyPress: true}),
      captured: keyOf({onKeyPressCapture: true})
    }
  },
  keyUp: {
    phasedRegistrationNames: {
      bubbled: keyOf({onKeyUp: true}),
      captured: keyOf({onKeyUpCapture: true})
    }
  },
  // Note: We do not allow listening to mouseOver events. Instead, use the
  // onMouseEnter/onMouseLeave created by `EnterLeaveEventPlugin`.
  mouseDown: {
    phasedRegistrationNames: {
      bubbled: keyOf({onMouseDown: true}),
      captured: keyOf({onMouseDownCapture: true})
    }
  },
  mouseMove: {
    phasedRegistrationNames: {
      bubbled: keyOf({onMouseMove: true}),
      captured: keyOf({onMouseMoveCapture: true})
    }
  },
  mouseUp: {
    phasedRegistrationNames: {
      bubbled: keyOf({onMouseUp: true}),
      captured: keyOf({onMouseUpCapture: true})
    }
  },
  scroll: {
    phasedRegistrationNames: {
      bubbled: keyOf({onScroll: true}),
      captured: keyOf({onScrollCapture: true})
    }
  },
  submit: {
    phasedRegistrationNames: {
      bubbled: keyOf({onSubmit: true}),
      captured: keyOf({onSubmitCapture: true})
    }
  },
  touchCancel: {
    phasedRegistrationNames: {
      bubbled: keyOf({onTouchCancel: true}),
      captured: keyOf({onTouchCancelCapture: true})
    }
  },
  touchEnd: {
    phasedRegistrationNames: {
      bubbled: keyOf({onTouchEnd: true}),
      captured: keyOf({onTouchEndCapture: true})
    }
  },
  touchMove: {
    phasedRegistrationNames: {
      bubbled: keyOf({onTouchMove: true}),
      captured: keyOf({onTouchMoveCapture: true})
    }
  },
  touchStart: {
    phasedRegistrationNames: {
      bubbled: keyOf({onTouchStart: true}),
      captured: keyOf({onTouchStartCapture: true})
    }
  },
  wheel: {
    phasedRegistrationNames: {
      bubbled: keyOf({onWheel: true}),
      captured: keyOf({onWheelCapture: true})
    }
  }
};

var topLevelEventsToDispatchConfig = {
  topBlur:        eventTypes.blur,
  topClick:       eventTypes.click,
  topDoubleClick: eventTypes.doubleClick,
  topDOMCharacterDataModified: eventTypes.DOMCharacterDataModified,
  topDrag:        eventTypes.drag,
  topDragEnd:     eventTypes.dragEnd,
  topDragEnter:   eventTypes.dragEnter,
  topDragExit:    eventTypes.dragExit,
  topDragLeave:   eventTypes.dragLeave,
  topDragOver:    eventTypes.dragOver,
  topDragStart:   eventTypes.dragStart,
  topDrop:        eventTypes.drop,
  topFocus:       eventTypes.focus,
  topInput:       eventTypes.input,
  topKeyDown:     eventTypes.keyDown,
  topKeyPress:    eventTypes.keyPress,
  topKeyUp:       eventTypes.keyUp,
  topMouseDown:   eventTypes.mouseDown,
  topMouseMove:   eventTypes.mouseMove,
  topMouseUp:     eventTypes.mouseUp,
  topScroll:      eventTypes.scroll,
  topSubmit:      eventTypes.submit,
  topTouchCancel: eventTypes.touchCancel,
  topTouchEnd:    eventTypes.touchEnd,
  topTouchMove:   eventTypes.touchMove,
  topTouchStart:  eventTypes.touchStart,
  topWheel:       eventTypes.wheel
};

var SimpleEventPlugin = {

  eventTypes: eventTypes,

  /**
   * Same as the default implementation, except cancels the event when return
   * value is false.
   *
   * @param {object} Event to be dispatched.
   * @param {function} Application-level callback.
   * @param {string} domID DOM ID to pass to the callback.
   */
  executeDispatch: function(event, listener, domID) {
    var returnValue = listener(event, domID);
    if (returnValue === false) {
      event.stopPropagation();
      event.preventDefault();
    }
  },

  /**
   * @param {string} topLevelType Record from `EventConstants`.
   * @param {DOMEventTarget} topLevelTarget The listening component root node.
   * @param {string} topLevelTargetID ID of `topLevelTarget`.
   * @param {object} nativeEvent Native browser event.
   * @return {*} An accumulation of synthetic events.
   * @see {EventPluginHub.extractEvents}
   */
  extractEvents: function(
      topLevelType,
      topLevelTarget,
      topLevelTargetID,
      nativeEvent) {
    var dispatchConfig = topLevelEventsToDispatchConfig[topLevelType];
    if (!dispatchConfig) {
      return null;
    }
    var EventConstructor;
    switch(topLevelType) {
      case topLevelTypes.topInput:
      case topLevelTypes.topSubmit:
        // HTML Events
        // @see http://www.w3.org/TR/html5/index.html#events-0
        EventConstructor = SyntheticEvent;
        break;
      case topLevelTypes.topKeyDown:
      case topLevelTypes.topKeyPress:
      case topLevelTypes.topKeyUp:
        EventConstructor = SyntheticKeyboardEvent;
        break;
      case topLevelTypes.topBlur:
      case topLevelTypes.topFocus:
        EventConstructor = SyntheticFocusEvent;
        break;
      case topLevelTypes.topClick:
      case topLevelTypes.topDoubleClick:
      case topLevelTypes.topDrag:
      case topLevelTypes.topDragEnd:
      case topLevelTypes.topDragEnter:
      case topLevelTypes.topDragExit:
      case topLevelTypes.topDragLeave:
      case topLevelTypes.topDragOver:
      case topLevelTypes.topDragStart:
      case topLevelTypes.topDrop:
      case topLevelTypes.topMouseDown:
      case topLevelTypes.topMouseMove:
      case topLevelTypes.topMouseUp:
        EventConstructor = SyntheticMouseEvent;
        break;
      case topLevelTypes.topDOMCharacterDataModified:
        EventConstructor = SyntheticMutationEvent;
        break;
      case topLevelTypes.topTouchCancel:
      case topLevelTypes.topTouchEnd:
      case topLevelTypes.topTouchMove:
      case topLevelTypes.topTouchStart:
        EventConstructor = SyntheticTouchEvent;
        break;
      case topLevelTypes.topScroll:
        EventConstructor = SyntheticUIEvent;
        break;
      case topLevelTypes.topWheel:
        EventConstructor = SyntheticWheelEvent;
        break;
    }
    invariant(EventConstructor);
    var event = EventConstructor.getPooled(
      dispatchConfig,
      topLevelTargetID,
      nativeEvent
    );
    EventPropagators.accumulateTwoPhaseDispatches(event);
    return event;
  }

};

module.exports = SimpleEventPlugin;

},{"./EventConstants":"Gaqr6V","./EventPropagators":"n/zMdI","./SyntheticEvent":"L5ht1h","./SyntheticFocusEvent":"ucaFnA","./SyntheticKeyboardEvent":"oNOIlC","./SyntheticMouseEvent":"v7zPvJ","./SyntheticMutationEvent":"FactSb","./SyntheticTouchEvent":"49cVaj","./SyntheticUIEvent":"unRgeP","./SyntheticWheelEvent":"MH4TbT","./invariant":"hPxNWC","./keyOf":"Q4rOoG"}],"L5ht1h":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule SyntheticEvent
 * @typechecks static-only
 */

"use strict";

var PooledClass = require("./PooledClass");

var emptyFunction = require("./emptyFunction");
var getEventTarget = require("./getEventTarget");
var merge = require("./merge");
var mergeInto = require("./mergeInto");

/**
 * @interface Event
 * @see http://www.w3.org/TR/DOM-Level-3-Events/
 */
var EventInterface = {
  type: null,
  target: getEventTarget,
  currentTarget: null,
  eventPhase: null,
  bubbles: null,
  cancelable: null,
  timeStamp: function(event) {
    return event.timeStamp || Date.now();
  },
  defaultPrevented: null,
  isTrusted: null
};

/**
 * Synthetic events are dispatched by event plugins, typically in response to a
 * top-level event delegation handler.
 *
 * These systems should generally use pooling to reduce the frequency of garbage
 * collection. The system should check `isPersistent` to determine whether the
 * event should be released into the pool after being dispatched. Users that
 * need a persisted event should invoke `persist`.
 *
 * Synthetic events (and subclasses) implement the DOM Level 3 Events API by
 * normalizing browser quirks. Subclasses do not necessarily have to implement a
 * DOM interface; custom application-specific events can also subclass this.
 *
 * @param {object} dispatchConfig Configuration used to dispatch this event.
 * @param {string} dispatchMarker Marker identifying the event target.
 * @param {object} nativeEvent Native browser event.
 */
function SyntheticEvent(dispatchConfig, dispatchMarker, nativeEvent) {
  this.dispatchConfig = dispatchConfig;
  this.dispatchMarker = dispatchMarker;
  this.nativeEvent = nativeEvent;

  var Interface = this.constructor.Interface;
  for (var propName in Interface) {
    if (!Interface.hasOwnProperty(propName)) {
      continue;
    }
    var normalize = Interface[propName];
    if (normalize) {
      this[propName] = normalize(nativeEvent);
    } else {
      this[propName] = nativeEvent[propName];
    }
  }

  if (nativeEvent.defaultPrevented || nativeEvent.returnValue === false) {
    this.isDefaultPrevented = emptyFunction.thatReturnsTrue;
  } else {
    this.isDefaultPrevented = emptyFunction.thatReturnsFalse;
  }
  this.isPropagationStopped = emptyFunction.thatReturnsFalse;
}

mergeInto(SyntheticEvent.prototype, {

  preventDefault: function() {
    this.defaultPrevented = true;
    var event = this.nativeEvent;
    event.preventDefault ? event.preventDefault() : event.returnValue = false;
    this.isDefaultPrevented = emptyFunction.thatReturnsTrue;
  },

  stopPropagation: function() {
    var event = this.nativeEvent;
    event.stopPropagation ? event.stopPropagation() : event.cancelBubble = true;
    this.isPropagationStopped = emptyFunction.thatReturnsTrue;
  },

  /**
   * We release all dispatched `SyntheticEvent`s after each event loop, adding
   * them back into the pool. This allows a way to hold onto a reference that
   * won't be added back into the pool.
   */
  persist: function() {
    this.isPersistent = emptyFunction.thatReturnsTrue;
  },

  /**
   * Checks if this event should be released back into the pool.
   *
   * @return {boolean} True if this should not be released, false otherwise.
   */
  isPersistent: emptyFunction.thatReturnsFalse,

  /**
   * `PooledClass` looks for `destructor` on each instance it releases.
   */
  destructor: function() {
    var Interface = this.constructor.Interface;
    for (var propName in Interface) {
      this[propName] = null;
    }
    this.dispatchConfig = null;
    this.dispatchMarker = null;
    this.nativeEvent = null;
  }

});

SyntheticEvent.Interface = EventInterface;

/**
 * Helper to reduce boilerplate when creating subclasses.
 *
 * @param {function} Class
 * @param {?object} Interface
 */
SyntheticEvent.augmentClass = function(Class, Interface) {
  var Super = this;

  var prototype = Object.create(Super.prototype);
  mergeInto(prototype, Class.prototype);
  Class.prototype = prototype;
  Class.prototype.constructor = Class;

  Class.Interface = merge(Super.Interface, Interface);
  Class.augmentClass = Super.augmentClass;

  PooledClass.addPoolingTo(Class, PooledClass.threeArgumentPooler);
};

PooledClass.addPoolingTo(SyntheticEvent, PooledClass.threeArgumentPooler);

module.exports = SyntheticEvent;

},{"./PooledClass":"5mz1Gs","./emptyFunction":"RxjlFd","./getEventTarget":"eoIwTT","./merge":"7duoWY","./mergeInto":"1Kx0L6"}],"ucaFnA":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule SyntheticFocusEvent
 * @typechecks static-only
 */

"use strict";

var SyntheticUIEvent = require("./SyntheticUIEvent");

/**
 * @interface FocusEvent
 * @see http://www.w3.org/TR/DOM-Level-3-Events/
 */
var FocusEventInterface = {
  relatedTarget: null
};

/**
 * @param {object} dispatchConfig Configuration used to dispatch this event.
 * @param {string} dispatchMarker Marker identifying the event target.
 * @param {object} nativeEvent Native browser event.
 * @extends {SyntheticUIEvent}
 */
function SyntheticFocusEvent(dispatchConfig, dispatchMarker, nativeEvent) {
  SyntheticUIEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent);
}

SyntheticUIEvent.augmentClass(SyntheticFocusEvent, FocusEventInterface);

module.exports = SyntheticFocusEvent;

},{"./SyntheticUIEvent":"unRgeP"}],"oNOIlC":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule SyntheticKeyboardEvent
 * @typechecks static-only
 */

"use strict";

var SyntheticUIEvent = require("./SyntheticUIEvent");

/**
 * @interface KeyboardEvent
 * @see http://www.w3.org/TR/DOM-Level-3-Events/
 */
var KeyboardEventInterface = {
  'char': null,
  key: null,
  location: null,
  ctrlKey: null,
  shiftKey: null,
  altKey: null,
  metaKey: null,
  repeat: null,
  locale: null,
  // Legacy Interface
  charCode: null,
  keyCode: null,
  which: null
};

/**
 * @param {object} dispatchConfig Configuration used to dispatch this event.
 * @param {string} dispatchMarker Marker identifying the event target.
 * @param {object} nativeEvent Native browser event.
 * @extends {SyntheticUIEvent}
 */
function SyntheticKeyboardEvent(dispatchConfig, dispatchMarker, nativeEvent) {
  SyntheticUIEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent);
}

SyntheticUIEvent.augmentClass(SyntheticKeyboardEvent, KeyboardEventInterface);

module.exports = SyntheticKeyboardEvent;

},{"./SyntheticUIEvent":"unRgeP"}],"v7zPvJ":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule SyntheticMouseEvent
 * @typechecks static-only
 */

"use strict";

var SyntheticUIEvent = require("./SyntheticUIEvent");
var ViewportMetrics = require("./ViewportMetrics");

/**
 * @interface MouseEvent
 * @see http://www.w3.org/TR/DOM-Level-3-Events/
 */
var MouseEventInterface = {
  screenX: null,
  screenY: null,
  clientX: null,
  clientY: null,
  ctrlKey: null,
  shiftKey: null,
  altKey: null,
  metaKey: null,
  button: function(event) {
    // Webkit, Firefox, IE9+
    // which:  1 2 3
    // button: 0 1 2 (standard)
    var button = event.button;
    if ('which' in event) {
      return button;
    }
    // IE<9
    // which:  undefined
    // button: 0 0 0
    // button: 1 4 2 (onmouseup)
    return button === 2 ? 2 : button === 4 ? 1 : 0;
  },
  buttons: null,
  relatedTarget: function(event) {
    return event.relatedTarget || (
      event.fromElement === event.srcElement ?
        event.toElement :
        event.fromElement
    );
  },
  // "Proprietary" Interface.
  pageX: function(event) {
    return 'pageX' in event ?
      event.pageX :
      event.clientX + ViewportMetrics.currentScrollLeft;
  },
  pageY: function(event) {
    return 'pageY' in event ?
      event.pageY :
      event.clientY + ViewportMetrics.currentScrollTop;
  }
};

/**
 * @param {object} dispatchConfig Configuration used to dispatch this event.
 * @param {string} dispatchMarker Marker identifying the event target.
 * @param {object} nativeEvent Native browser event.
 * @extends {SyntheticUIEvent}
 */
function SyntheticMouseEvent(dispatchConfig, dispatchMarker, nativeEvent) {
  SyntheticUIEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent);
}

SyntheticUIEvent.augmentClass(SyntheticMouseEvent, MouseEventInterface);

module.exports = SyntheticMouseEvent;

},{"./SyntheticUIEvent":"unRgeP","./ViewportMetrics":"sk6wio"}],"FactSb":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule SyntheticMutationEvent
 * @typechecks static-only
 */

"use strict";

var SyntheticEvent = require("./SyntheticEvent");

/**
 * @interface MutationEvent
 * @see http://www.w3.org/TR/DOM-Level-3-Events/
 */
var MutationEventInterface = {
  relatedNode: null,
  prevValue: null,
  newValue: null,
  attrName: null,
  attrChange: null
};

/**
 * @param {object} dispatchConfig Configuration used to dispatch this event.
 * @param {string} dispatchMarker Marker identifying the event target.
 * @param {object} nativeEvent Native browser event.
 * @extends {SyntheticEvent}
 */
function SyntheticMutationEvent(dispatchConfig, dispatchMarker, nativeEvent) {
  SyntheticEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent);
}

SyntheticEvent.augmentClass(SyntheticMutationEvent, MutationEventInterface);

module.exports = SyntheticMutationEvent;

},{"./SyntheticEvent":"L5ht1h"}],"49cVaj":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule SyntheticTouchEvent
 * @typechecks static-only
 */

"use strict";

var SyntheticUIEvent = require("./SyntheticUIEvent");

/**
 * @interface TouchEvent
 * @see http://www.w3.org/TR/DOM-Level-3-Events/
 */
var TouchEventInterface = {
  touches: null,
  targetTouches: null,
  changedTouches: null,
  altKey: null,
  metaKey: null,
  ctrlKey: null,
  shiftKey: null
};

/**
 * @param {object} dispatchConfig Configuration used to dispatch this event.
 * @param {string} dispatchMarker Marker identifying the event target.
 * @param {object} nativeEvent Native browser event.
 * @extends {SyntheticUIEvent}
 */
function SyntheticTouchEvent(dispatchConfig, dispatchMarker, nativeEvent) {
  SyntheticUIEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent);
}

SyntheticUIEvent.augmentClass(SyntheticTouchEvent, TouchEventInterface);

module.exports = SyntheticTouchEvent;

},{"./SyntheticUIEvent":"unRgeP"}],"unRgeP":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule SyntheticUIEvent
 * @typechecks static-only
 */

"use strict";

var SyntheticEvent = require("./SyntheticEvent");

/**
 * @interface UIEvent
 * @see http://www.w3.org/TR/DOM-Level-3-Events/
 */
var UIEventInterface = {
  view: null,
  detail: null
};

/**
 * @param {object} dispatchConfig Configuration used to dispatch this event.
 * @param {string} dispatchMarker Marker identifying the event target.
 * @param {object} nativeEvent Native browser event.
 * @extends {SyntheticEvent}
 */
function SyntheticUIEvent(dispatchConfig, dispatchMarker, nativeEvent) {
  SyntheticEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent);
}

SyntheticEvent.augmentClass(SyntheticUIEvent, UIEventInterface);

module.exports = SyntheticUIEvent;

},{"./SyntheticEvent":"L5ht1h"}],"MH4TbT":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule SyntheticWheelEvent
 * @typechecks static-only
 */

"use strict";

var SyntheticMouseEvent = require("./SyntheticMouseEvent");

/**
 * @interface WheelEvent
 * @see http://www.w3.org/TR/DOM-Level-3-Events/
 */
var WheelEventInterface = {
  deltaX: function(event) {
    // NOTE: IE<9 does not support x-axis delta.
    return (
      'deltaX' in event ? event.deltaX :
      // Fallback to `wheelDeltaX` for Webkit and normalize (right is positive).
      'wheelDeltaX' in event ? -event.wheelDeltaX : 0
    );
  },
  deltaY: function(event) {
    return (
      // Normalize (up is positive).
      'deltaY' in event ? -event.deltaY :
      // Fallback to `wheelDeltaY` for Webkit.
      'wheelDeltaY' in event ? event.wheelDeltaY :
      // Fallback to `wheelDelta` for IE<9.
      'wheelDelta' in event ? event.wheelData : 0
    );
  },
  deltaZ: null,
  deltaMode: null
};

/**
 * @param {object} dispatchConfig Configuration used to dispatch this event.
 * @param {string} dispatchMarker Marker identifying the event target.
 * @param {object} nativeEvent Native browser event.
 * @extends {SyntheticMouseEvent}
 */
function SyntheticWheelEvent(dispatchConfig, dispatchMarker, nativeEvent) {
  SyntheticMouseEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent);
}

SyntheticMouseEvent.augmentClass(SyntheticWheelEvent, WheelEventInterface);

module.exports = SyntheticWheelEvent;

},{"./SyntheticMouseEvent":"v7zPvJ"}],"aekoY0":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule Transaction
 */

"use strict";

var invariant = require("./invariant");

/**
 * `Transaction` creates a black box that is able to wrap any method such that
 * certain invariants are maintained before and after the method is invoked
 * (Even if an exception is thrown while invoking the wrapped method). Whoever
 * instantiates a transaction can provide enforcers of the invariants at
 * creation time. The `Transaction` class itself will supply one additional
 * automatic invariant for you - the invariant that any transaction instance
 * should not be ran while it is already being ran. You would typically create a
 * single instance of a `Transaction` for reuse multiple times, that potentially
 * is used to wrap several different methods. Wrappers are extremely simple -
 * they only require implementing two methods.
 *
 * <pre>
 *                       wrappers (injected at creation time)
 *                                      +        +
 *                                      |        |
 *                    +-----------------|--------|--------------+
 *                    |                 v        |              |
 *                    |      +---------------+   |              |
 *                    |   +--|    wrapper1   |---|----+         |
 *                    |   |  +---------------+   v    |         |
 *                    |   |          +-------------+  |         |
 *                    |   |     +----|   wrapper2  |--------+   |
 *                    |   |     |    +-------------+  |     |   |
 *                    |   |     |                     |     |   |
 *                    |   v     v                     v     v   | wrapper
 *                    | +---+ +---+   +---------+   +---+ +---+ | invariants
 * perform(anyMethod) | |   | |   |   |         |   |   | |   | | maintained
 * +----------------->|-|---|-|---|-->|anyMethod|---|---|-|---|-|-------->
 *                    | |   | |   |   |         |   |   | |   | |
 *                    | |   | |   |   |         |   |   | |   | |
 *                    | |   | |   |   |         |   |   | |   | |
 *                    | +---+ +---+   +---------+   +---+ +---+ |
 *                    |  initialize                    close    |
 *                    +-----------------------------------------+
 * </pre>
 *
 * Bonus:
 * - Reports timing metrics by method name and wrapper index.
 *
 * Use cases:
 * - Preserving the input selection ranges before/after reconciliation.
 *   Restoring selection even in the event of an unexpected error.
 * - Deactivating events while rearranging the DOM, preventing blurs/focuses,
 *   while guaranteeing that afterwards, the event system is reactivated.
 * - Flushing a queue of collected DOM mutations to the main UI thread after a
 *   reconciliation takes place in a worker thread.
 * - Invoking any collected `componentDidRender` callbacks after rendering new
 *   content.
 * - (Future use case): Wrapping particular flushes of the `ReactWorker` queue
 *   to preserve the `scrollTop` (an automatic scroll aware DOM).
 * - (Future use case): Layout calculations before and after DOM upates.
 *
 * Transactional plugin API:
 * - A module that has an `initialize` method that returns any precomputation.
 * - and a `close` method that accepts the precomputation. `close` is invoked
 *   when the wrapped process is completed, or has failed.
 *
 * @param {Array<TransactionalWrapper>} transactionWrapper Wrapper modules
 * that implement `initialize` and `close`.
 * @return {Transaction} Single transaction for reuse in thread.
 *
 * @class Transaction
 */
var Mixin = {
  /**
   * Sets up this instance so that it is prepared for collecting metrics. Does
   * so such that this setup method may be used on an instance that is already
   * initialized, in a way that does not consume additional memory upon reuse.
   * That can be useful if you decide to make your subclass of this mixin a
   * "PooledClass".
   */
  reinitializeTransaction: function() {
    this.transactionWrappers = this.getTransactionWrappers();
    if (!this.wrapperInitData) {
      this.wrapperInitData = [];
    } else {
      this.wrapperInitData.length = 0;
    }
    if (!this.timingMetrics) {
      this.timingMetrics = {};
    }
    this.timingMetrics.methodInvocationTime = 0;
    if (!this.timingMetrics.wrapperInitTimes) {
      this.timingMetrics.wrapperInitTimes = [];
    } else {
      this.timingMetrics.wrapperInitTimes.length = 0;
    }
    if (!this.timingMetrics.wrapperCloseTimes) {
      this.timingMetrics.wrapperCloseTimes = [];
    } else {
      this.timingMetrics.wrapperCloseTimes.length = 0;
    }
    this._isInTransaction = false;
  },

  _isInTransaction: false,

  /**
   * @abstract
   * @return {Array<TransactionWrapper>} Array of transaction wrappers.
   */
  getTransactionWrappers: null,

  isInTransaction: function() {
    return !!this._isInTransaction;
  },

  /**
   * Executes the function within a safety window. Use this for the top level
   * methods that result in large amounts of computation/mutations that would
   * need to be safety checked.
   *
   * @param {function} method Member of scope to call.
   * @param {Object} scope Scope to invoke from.
   * @param {Object?=} args... Arguments to pass to the method (optional).
   *                           Helps prevent need to bind in many cases.
   * @return Return value from `method`.
   */
  perform: function(method, scope, a, b, c, d, e, f) {
    invariant(!this.isInTransaction());
    var memberStart = Date.now();
    var errorToThrow = null;
    var ret;
    try {
      this.initializeAll();
      ret = method.call(scope, a, b, c, d, e, f);
    } catch (error) {
      // IE8 requires `catch` in order to use `finally`.
      errorToThrow = error;
    } finally {
      var memberEnd = Date.now();
      this.methodInvocationTime += (memberEnd - memberStart);
      try {
        this.closeAll();
      } catch (closeError) {
        // If `method` throws, prefer to show that stack trace over any thrown
        // by invoking `closeAll`.
        errorToThrow = errorToThrow || closeError;
      }
    }
    if (errorToThrow) {
      throw errorToThrow;
    }
    return ret;
  },

  initializeAll: function() {
    this._isInTransaction = true;
    var transactionWrappers = this.transactionWrappers;
    var wrapperInitTimes = this.timingMetrics.wrapperInitTimes;
    var errorToThrow = null;
    for (var i = 0; i < transactionWrappers.length; i++) {
      var initStart = Date.now();
      var wrapper = transactionWrappers[i];
      try {
        this.wrapperInitData[i] = wrapper.initialize ?
          wrapper.initialize.call(this) :
          null;
      } catch (initError) {
        // Prefer to show the stack trace of the first error.
        errorToThrow = errorToThrow || initError;
        this.wrapperInitData[i] = Transaction.OBSERVED_ERROR;
      } finally {
        var curInitTime = wrapperInitTimes[i];
        var initEnd = Date.now();
        wrapperInitTimes[i] = (curInitTime || 0) + (initEnd - initStart);
      }
    }
    if (errorToThrow) {
      throw errorToThrow;
    }
  },

  /**
   * Invokes each of `this.transactionWrappers.close[i]` functions, passing into
   * them the respective return values of `this.transactionWrappers.init[i]`
   * (`close`rs that correspond to initializers that failed will not be
   * invoked).
   */
  closeAll: function() {
    invariant(this.isInTransaction());
    var transactionWrappers = this.transactionWrappers;
    var wrapperCloseTimes = this.timingMetrics.wrapperCloseTimes;
    var errorToThrow = null;
    for (var i = 0; i < transactionWrappers.length; i++) {
      var wrapper = transactionWrappers[i];
      var closeStart = Date.now();
      var initData = this.wrapperInitData[i];
      try {
        if (initData !== Transaction.OBSERVED_ERROR) {
          wrapper.close && wrapper.close.call(this, initData);
        }
      } catch (closeError) {
        // Prefer to show the stack trace of the first error.
        errorToThrow = errorToThrow || closeError;
      } finally {
        var closeEnd = Date.now();
        var curCloseTime = wrapperCloseTimes[i];
        wrapperCloseTimes[i] = (curCloseTime || 0) + (closeEnd - closeStart);
      }
    }
    this.wrapperInitData.length = 0;
    this._isInTransaction = false;
    if (errorToThrow) {
      throw errorToThrow;
    }
  }
};

var Transaction = {

  Mixin: Mixin,

  /**
   * Token to look for to determine if an error occured.
   */
  OBSERVED_ERROR: {}

};

module.exports = Transaction;

},{"./invariant":"hPxNWC"}],"sk6wio":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ViewportMetrics
 */

"use strict";

var ViewportMetrics = {

  currentScrollLeft: 0,

  currentScrollTop: 0,

  refreshScrollValues: function() {
    ViewportMetrics.currentScrollLeft =
      document.body.scrollLeft + document.documentElement.scrollLeft;
    ViewportMetrics.currentScrollTop =
      document.body.scrollTop + document.documentElement.scrollTop;
  }

};

module.exports = ViewportMetrics;

},{}],"rpm6kU":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule accumulate
 */

"use strict";

var invariant = require("./invariant");

/**
 * Accumulates items that must not be null or undefined.
 *
 * This is used to conserve memory by avoiding array allocations.
 *
 * @return {*|array<*>} An accumulation of items.
 */
function accumulate(current, next) {
  invariant(next != null);
  if (current == null) {
    return next;
  } else {
    // Both are not empty. Warning: Never call x.concat(y) when you are not
    // certain that x is an Array (x could be a string with concat method).
    var currentIsArray = Array.isArray(current);
    var nextIsArray = Array.isArray(next);
    if (currentIsArray) {
      return current.concat(next);
    } else {
      if (nextIsArray) {
        return [current].concat(next);
      } else {
        return [current, next];
      }
    }
  }
}

module.exports = accumulate;

},{"./invariant":"hPxNWC"}],"5ukn/R":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule adler32
 */

"use strict";

var MOD = 65521;

// This is a clean-room implementation of adler32 designed for detecting
// if markup is not what we expect it to be. It does not need to be
// cryptographically strong, only reasonable good at detecting if markup
// generated on the server is different than that on the client.
function adler32(data) {
  var a = 1;
  var b = 0;
  for (var i = 0; i < data.length; i++) {
    a = (a + data.charCodeAt(i)) % MOD;
    b = (b + a) % MOD;
  }
  return a | (b << 16);
}

module.exports = adler32;

},{}],"M+gx0D":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule copyProperties
 */

/**
 * Copy properties from one or more objects (up to 5) into the first object.
 * This is a shallow copy. It mutates the first object and also returns it.
 *
 * NOTE: `arguments` has a very significant performance penalty, which is why
 * we don't support unlimited arguments.
 */
function copyProperties(obj, a, b, c, d, e, f) {
    obj = obj || {};
    var args = [a, b, c, d, e];
    var ii = 0, v;

    while (args[ii]) {
      v = args[ii++];
      for (var k in v) {
        obj[k] = v[k];
      }

      // IE ignores toString in object iteration.. See:
      // webreflection.blogspot.com/2007/07/quick-fix-internet-explorer-and.html
      if (v.hasOwnProperty && v.hasOwnProperty('toString') &&
          (typeof v.toString != 'undefined') && (obj.toString !== v.toString)) {
        obj.toString = v.toString;
      }
    }

    return obj;
}

module.exports = copyProperties;

},{}],"HDEmgB":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule createArrayFrom
 * @typechecks
 */

/**
 * NOTE: if you are a previous user of this function, it has been considered
 * unsafe because it's inconsistent across browsers for some inputs.
 * Instead use `Array.isArray()`.
 *
 * Perform a heuristic test to determine if an object is "array-like".
 *
 *   A monk asked Joshu, a Zen master, "Has a dog Buddha nature?"
 *   Joshu replied: "Mu."
 *
 * This function determines if its argument has "array nature": it returns
 * true if the argument is an actual array, an `arguments' object, or an
 * HTMLCollection (e.g. node.childNodes or node.getElementsByTagName()).
 *
 * @param {*} obj
 * @return {boolean}
 */
function hasArrayNature(obj) {
  return (
    // not null/false
    !!obj &&
    // arrays are objects, NodeLists are functions in Safari
    (typeof obj == 'object' || typeof obj == 'function') &&
    // quacks like an array
    ('length' in obj) &&
    // not window
    !('setInterval' in obj) &&
    // no DOM node should be considered an array-like
    // a 'select' element has 'length' and 'item' properties on IE8
    (typeof obj.nodeType != 'number') &&
    (
      // a real array
      (// HTMLCollection/NodeList
      (Array.isArray(obj) ||
      // arguments
      ('callee' in obj) || 'item' in obj))
    )
  );
}

/**
 * Ensure that the argument is an array by wrapping it in an array if it is not.
 * Creates a copy of the argument if it is already an array.
 *
 * This is mostly useful idiomatically:
 *
 *   var createArrayFrom = require('createArrayFrom');
 *
 *   function takesOneOrMoreThings(things) {
 *     things = createArrayFrom(things);
 *     ...
 *   }
 *
 * This allows you to treat `things' as an array, but accept scalars in the API.
 *
 * This is also good for converting certain pseudo-arrays, like `arguments` or
 * HTMLCollections, into arrays.
 *
 * @param {*} obj
 * @return {array}
 */
function createArrayFrom(obj) {
  if (!hasArrayNature(obj)) {
    return [obj];
  }
  if (obj.item) {
    // IE does not support Array#slice on HTMLCollections
    var l = obj.length, ret = new Array(l);
    while (l--) { ret[l] = obj[l]; }
    return ret;
  }
  return Array.prototype.slice.call(obj);
}

module.exports = createArrayFrom;

},{}],"iqoonm":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule createNodesFromMarkup
 * @typechecks
 */

/*jslint evil: true, sub: true */

var ExecutionEnvironment = require("./ExecutionEnvironment");

var createArrayFrom = require("./createArrayFrom");
var getMarkupWrap = require("./getMarkupWrap");
var invariant = require("./invariant");

/**
 * Dummy container used to render all markup.
 */
var dummyNode =
  ExecutionEnvironment.canUseDOM ? document.createElement('div') : null;

/**
 * Pattern used by `getNodeName`.
 */
var nodeNamePattern = /^\s*<(\w+)/;

/**
 * Extracts the `nodeName` of the first element in a string of markup.
 *
 * @param {string} markup String of markup.
 * @return {?string} Node name of the supplied markup.
 */
function getNodeName(markup) {
  var nodeNameMatch = markup.match(nodeNamePattern);
  return nodeNameMatch && nodeNameMatch[1].toLowerCase();
}

/**
 * Creates an array containing the nodes rendered from the supplied markup. The
 * optionally supplied `handleScript` function will be invoked once for each
 * <script> element that is rendered. If no `handleScript` function is supplied,
 * an exception is thrown if any <script> elements are rendered.
 *
 * @param {string} markup A string of valid HTML markup.
 * @param {?function} handleScript Invoked once for each rendered <script>.
 * @return {array<DOMElement|DOMTextNode>} An array of rendered nodes.
 */
function createNodesFromMarkup(markup, handleScript) {
  var node = dummyNode;
  invariant(!!dummyNode);
  var nodeName = getNodeName(markup);

  var wrap = nodeName && getMarkupWrap(nodeName);
  if (wrap) {
    node.innerHTML = wrap[1] + markup + wrap[2];

    var wrapDepth = wrap[0];
    while (wrapDepth--) {
      node = node.lastChild;
    }
  } else {
    node.innerHTML = markup;
  }

  var scripts = node.getElementsByTagName('script');
  if (scripts.length) {
    invariant(handleScript);
    createArrayFrom(scripts).forEach(handleScript);
  }

  var nodes = createArrayFrom(node.childNodes);
  while (node.lastChild) {
    node.removeChild(node.lastChild);
  }
  return nodes;
}

module.exports = createNodesFromMarkup;

},{"./ExecutionEnvironment":"mrmvk9","./createArrayFrom":"HDEmgB","./getMarkupWrap":"a26iu1","./invariant":"hPxNWC"}],"OocYg9":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule createObjectFrom
 */

/**
 * Construct an object from an array of keys
 * and optionally specified value or list of values.
 *
 *  >>> createObjectFrom(['a','b','c']);
 *  {a: true, b: true, c: true}
 *
 *  >>> createObjectFrom(['a','b','c'], false);
 *  {a: false, b: false, c: false}
 *
 *  >>> createObjectFrom(['a','b','c'], 'monkey');
 *  {c:'monkey', b:'monkey' c:'monkey'}
 *
 *  >>> createObjectFrom(['a','b','c'], [1,2,3]);
 *  {a: 1, b: 2, c: 3}
 *
 *  >>> createObjectFrom(['women', 'men'], [true, false]);
 *  {women: true, men: false}
 *
 * @param   Array   list of keys
 * @param   mixed   optional value or value array.  defaults true.
 * @returns object
 */
function createObjectFrom(keys, values /* = true */) {
    var object = {};
    var isArray = Array.isArray(values);

    if (typeof values == 'undefined') {
      values = true;
    }

    for (var ii = keys.length; ii--;) {
      object[keys[ii]] = isArray ? values[ii] : values;
    }

    return object;
}

module.exports = createObjectFrom;

},{}],"vbLjBj":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule dangerousStyleValue
 * @typechecks static-only
 */

"use strict";

var CSSProperty = require("./CSSProperty");

/**
 * Convert a value into the proper css writable value. The `styleName` name
 * name should be logical (no hyphens), as specified
 * in `CSSProperty.isUnitlessNumber`.
 *
 * @param {string} styleName CSS property name such as `topMargin`.
 * @param {*} value CSS property value such as `10px`.
 * @return {string} Normalized style value with dimensions applied.
 */
function dangerousStyleValue(styleName, value) {
  // Note that we've removed escapeTextForBrowser() calls here since the
  // whole string will be escaped when the attribute is injected into
  // the markup. If you provide unsafe user data here they can inject
  // arbitrary CSS which may be problematic (I couldn't repro this):
  // https://www.owasp.org/index.php/XSS_Filter_Evasion_Cheat_Sheet
  // http://www.thespanner.co.uk/2007/11/26/ultimate-xss-css-injection/
  // This is not an XSS hole but instead a potential CSS injection issue
  // which has lead to a greater discussion about how we're going to
  // trust URLs moving forward. See #2115901

  var isEmpty = value == null || typeof value === 'boolean' || value === '';
  if (isEmpty) {
    return '';
  }

  var isNonNumeric = isNaN(value);
  if (isNonNumeric || value === 0 || CSSProperty.isUnitlessNumber[styleName]) {
    return '' + value; // cast to string
  }

  return value + 'px';
}

module.exports = dangerousStyleValue;

},{"./CSSProperty":"sWBULG"}],"RxjlFd":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule emptyFunction
 */

var copyProperties = require("./copyProperties");

function makeEmptyFunction(arg) {
  return function() {
    return arg;
  };
}

/**
 * This function accepts and discards inputs; it has no side effects. This is
 * primarily useful idiomatically for overridable function endpoints which
 * always need to be callable, since JS lacks a null-call idiom ala Cocoa.
 */
function emptyFunction() {}

copyProperties(emptyFunction, {
  thatReturns: makeEmptyFunction,
  thatReturnsFalse: makeEmptyFunction(false),
  thatReturnsTrue: makeEmptyFunction(true),
  thatReturnsNull: makeEmptyFunction(null),
  thatReturnsThis: function() { return this; },
  thatReturnsArgument: function(arg) { return arg; }
});

module.exports = emptyFunction;

},{"./copyProperties":"M+gx0D"}],"ZaIegL":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule escapeTextForBrowser
 * @typechecks static-only
 */

"use strict";

var invariant = require("./invariant");

var ESCAPE_LOOKUP = {
  "&": "&amp;",
  ">": "&gt;",
  "<": "&lt;",
  "\"": "&quot;",
  "'": "&#x27;",
  "/": "&#x2f;"
};

function escaper(match) {
  return ESCAPE_LOOKUP[match];
}

/**
 * Escapes text to prevent scripting attacks.
 *
 * @param {number|string} text Text value to escape.
 * @return {string} An escaped string.
 */
function escapeTextForBrowser(text) {
  var type = typeof text;
  invariant(type !== 'object');
  if (text === '') {
    return '';
  } else {
    if (type === 'string') {
      return text.replace(/[&><"'\/]/g, escaper);
    } else {
      return (''+text).replace(/[&><"'\/]/g, escaper);
    }
  }
}

module.exports = escapeTextForBrowser;

},{"./invariant":"hPxNWC"}],"bHKEgX":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ex
 * @typechecks
 * @nostacktrace
 */

/**
 * This function transforms error message with arguments into plain text error
 * message, so that it can be passed to window.onerror without losing anything.
 * It can then be transformed back by `erx()` function.
 *
 * Usage:
 *   throw new Error(ex('Error %s from %s', errorCode, userID));
 *
 * @param {string} errorMessage
 */

var ex = function(errorMessage/*, arg1, arg2, ...*/) {
  var args = Array.prototype.slice.call(arguments).map(function(arg) {
    return String(arg);
  });
  var expectedLength = errorMessage.split('%s').length - 1;

  if (expectedLength !== args.length - 1) {
    // something wrong with the formatting string
    return ex('ex args number mismatch: %s', JSON.stringify(args));
  }

  return ex._prefix + JSON.stringify(args) + ex._suffix;
};

ex._prefix = '<![EX[';
ex._suffix = ']]>';

module.exports = ex;

},{}],"cza1WC":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule flattenChildren
 */

"use strict";

var invariant = require("./invariant");
var traverseAllChildren = require("./traverseAllChildren");

/**
 * @param {function} traverseContext Context passed through traversal.
 * @param {?ReactComponent} child React child component.
 * @param {!string} name String name of key path to child.
 */
function flattenSingleChildIntoContext(traverseContext, child, name) {
  // We found a component instance.
  var result = traverseContext;
  invariant(!result.hasOwnProperty(name));
  result[name] = child;
}

/**
 * Flattens children that are typically specified as `props.children`.
 * @return {!object} flattened children keyed by name.
 */
function flattenChildren(children) {
  if (children == null) {
    return children;
  }
  var result = {};
  traverseAllChildren(children, flattenSingleChildIntoContext, result);
  return result;
}

module.exports = flattenChildren;

},{"./invariant":"hPxNWC","./traverseAllChildren":"27ud2W"}],"pcy7SL":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule forEachAccumulated
 */

"use strict";

/**
 * @param {array} an "accumulation" of items which is either an Array or
 * a single item. Useful when paired with the `accumulate` module. This is a
 * simple utility that allows us to reason about a collection of items, but
 * handling the case when there is exactly one item (and we do not need to
 * allocate an array).
 */
var forEachAccumulated = function(arr, cb, scope) {
  if (Array.isArray(arr)) {
    arr.forEach(cb, scope);
  } else if (arr) {
    cb.call(scope, arr);
  }
};

module.exports = forEachAccumulated;

},{}],"7THwY4":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ge
 */

/**
 * Find a node by ID.  Optionally search a sub-tree outside of the document
 *
 * Use ge if you're not sure whether or not the element exists. You can test
 * for existence yourself in your application code.
 *
 * If your application code depends on the existence of the element, use $
 * instead, which will throw in DEV if the element doesn't exist.
 */
function ge(arg, root, tag) {
  return typeof arg != 'string' ? arg :
    !root ? document.getElementById(arg) :
    _geFromSubtree(arg, root, tag);
}

function _geFromSubtree(id, root, tag) {
  var elem, children, ii;

  if (_getNodeID(root) == id) {
    return root;
  } else if (root.getElementsByTagName) {
    // All Elements implement this, which does an iterative DFS, which is
    // faster than recursion and doesn't run into stack depth issues.
    children = root.getElementsByTagName(tag || '*');
    for (ii = 0; ii < children.length; ii++) {
      if (_getNodeID(children[ii]) == id) {
        return children[ii];
      }
    }
  } else {
    // DocumentFragment does not implement getElementsByTagName, so
    // recurse over its children. Its children must be Elements, so
    // each child will use the getElementsByTagName case instead.
    children = root.childNodes;
    for (ii = 0; ii < children.length; ii++) {
      elem = _geFromSubtree(id, children[ii]);
      if (elem) {
        return elem;
      }
    }
  }

  return null;
}

/**
 * Return the ID value for a given node. This allows us to avoid issues
 * with forms that contain inputs with name="id".
 *
 * @return string (null if attribute not set)
 */
function _getNodeID(node) {
  // #document and #document-fragment do not have getAttributeNode.
  var id = node.getAttributeNode && node.getAttributeNode('id');
  return id ? id.value : null;
}

module.exports = ge;

},{}],"eoIwTT":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule getEventTarget
 * @typechecks static-only
 */

"use strict";

var ExecutionEnvironment = require("./ExecutionEnvironment");

/**
 * Gets the target node from a native browser event by accounting for
 * inconsistencies in browser DOM APIs.
 *
 * @param {object} nativeEvent Native browser event.
 * @return {DOMEventTarget} Target node.
 */
function getEventTarget(nativeEvent) {
  var target =
    nativeEvent.target ||
    nativeEvent.srcElement ||
    ExecutionEnvironment.global;
  // Safari may fire events on text nodes (Node.TEXT_NODE is 3).
  // @see http://www.quirksmode.org/js/events_properties.html
  return target.nodeType === 3 ? target.parentNode : target;
}

module.exports = getEventTarget;

},{"./ExecutionEnvironment":"mrmvk9"}],"a26iu1":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule getMarkupWrap
 */

var ExecutionEnvironment = require("./ExecutionEnvironment");

var invariant = require("./invariant");

/**
 * Dummy container used to detect which wraps are necessary.
 */
var dummyNode =
  ExecutionEnvironment.canUseDOM ? document.createElement('div') : null;

/**
 * Some browsers cannot use `innerHTML` to render certain elements standalone,
 * so we wrap them, render the wrapped nodes, then extract the desired node.
 *
 * In IE8, certain elements cannot render alone, so wrap all elements ('*').
 */
var shouldWrap = {};
var markupWrap = {
  'area': [1, '<map>', '</map>'],
  'caption': [1, '<table>', '</table>'],
  'col': [2, '<table><tbody></tbody><colgroup>', '</colgroup></table>'],
  'colgroup': [1, '<table>', '</table>'],
  'legend': [1, '<fieldset>', '</fieldset>'],
  'optgroup': [1, '<select multiple="true">', '</select>'],
  'option': [1, '<select multiple="true">', '</select>'],
  'param': [1, '<object>', '</object>'],
  'tbody': [1, '<table>', '</table>'],
  'td': [3, '<table><tbody><tr>', '</tr></tbody></table>'],
  'tfoot': [1, '<table>', '</table>'],
  'th': [3, '<table><tbody><tr>', '</tr></tbody></table>'],
  'thead': [1, '<table>', '</table>'],
  'tr': [2, '<table><tbody>', '</tbody></table>'],
  '*': [1, '?<div>', '</div>']
};

/**
 * Gets the markup wrap configuration for the supplied `nodeName`.
 *
 * NOTE: This lazily detects which wraps are necessary for the current browser.
 *
 * @param {string} nodeName Lowercase `nodeName`.
 * @return {?array} Markup wrap configuration, if applicable.
 */
function getMarkupWrap(nodeName) {
  invariant(!!dummyNode);
  if (!markupWrap.hasOwnProperty(nodeName)) {
    nodeName = '*';
  }
  if (!shouldWrap.hasOwnProperty(nodeName)) {
    if (nodeName === '*') {
      dummyNode.innerHTML = '<link />';
    } else {
      dummyNode.innerHTML = '<' + nodeName + '></' + nodeName + '>';
    }
    shouldWrap[nodeName] = !dummyNode.firstChild;
  }
  return shouldWrap[nodeName] ? markupWrap[nodeName] : null;
}


module.exports = getMarkupWrap;

},{"./ExecutionEnvironment":"mrmvk9","./invariant":"hPxNWC"}],"sz+OE9":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule getReactRootElementInContainer
 */

"use strict";

/**
 * @param {DOMElement} container DOM element that may contain a React component
 * @return {?*} DOM element that may have the reactRoot ID, or null.
 */
function getReactRootElementInContainer(container) {
  return container && container.firstChild;
}

module.exports = getReactRootElementInContainer;

},{}],"Suh93r":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule getTextContentAccessor
 */

"use strict";

var ExecutionEnvironment = require("./ExecutionEnvironment");

var contentKey = null;

/**
 * Gets the key used to access text content on a DOM node.
 *
 * @return {?string} Key used to access text content.
 * @internal
 */
function getTextContentAccessor() {
  if (!contentKey && ExecutionEnvironment.canUseDOM) {
    contentKey = 'innerText' in document.createElement('div') ?
      'innerText' :
      'textContent';
  }
  return contentKey;
}

module.exports = getTextContentAccessor;

},{"./ExecutionEnvironment":"mrmvk9"}],"lqHdFC":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule hyphenate
 * @typechecks
 */

var _uppercasePattern = /([A-Z])/g;

/**
 * Hyphenates a camelcased string, for example:
 *
 *   > hyphenate('backgroundColor')
 *   < "background-color"
 *
 * @param {string} string
 * @return {string}
 */
function hyphenate(string) {
  return string.replace(_uppercasePattern, '-$1').toLowerCase();
}

module.exports = hyphenate;

},{}],"hPxNWC":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule invariant
 */

/**
 * Use invariant() to assert state which your program assumes to be true.
 *
 * Provide sprintf style format and arguments to provide information about
 * what broke and what you were expecting.
 *
 * The invariant message will be stripped in production, but the invariant
 * will remain to ensure logic does not differ in production.
 */

function invariant(condition) {
  if (!condition) {
    throw new Error('Invariant Violation');
  }
}

module.exports = invariant;

},{}],"Iv78kc":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule isEventSupported
 */

"use strict";

var ExecutionEnvironment = require("./ExecutionEnvironment");

var testNode, useHasFeature;
if (ExecutionEnvironment.canUseDOM) {
  testNode = document.createElement('div');
  useHasFeature =
    document.implementation &&
    document.implementation.hasFeature &&
    // `hasFeature` always returns true in Firefox 19+.
    document.implementation.hasFeature('', '') !== true;
}

/**
 * Checks if an event is supported in the current execution environment.
 *
 * NOTE: This will not work correctly for non-generic events such as `change`,
 * `reset`, `load`, `error`, and `select`.
 *
 * Borrows from Modernizr.
 *
 * @param {string} eventNameSuffix Event name, e.g. "click".
 * @param {?boolean} capture Check if the capture phase is supported.
 * @return {boolean} True if the event is supported.
 * @internal
 * @license Modernizr 3.0.0pre (Custom Build) | MIT
 */
function isEventSupported(eventNameSuffix, capture) {
  if (!testNode || (capture && !testNode.addEventListener)) {
    return false;
  }
  var element = document.createElement('div');

  var eventName = 'on' + eventNameSuffix;
  var isSupported = eventName in element;

  if (!isSupported) {
    element.setAttribute(eventName, '');
    isSupported = typeof element[eventName] === 'function';
    if (typeof element[eventName] !== 'undefined') {
      element[eventName] = undefined;
    }
    element.removeAttribute(eventName);
  }

  if (!isSupported && useHasFeature && eventNameSuffix === 'wheel') {
    // This is the only way to test support for the `wheel` event in IE9+.
    isSupported = document.implementation.hasFeature('Events.wheel', '3.0');
  }

  element = null;
  return isSupported;
}

module.exports = isEventSupported;

},{"./ExecutionEnvironment":"mrmvk9"}],"odpU/7":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule joinClasses
 * @typechecks static-only
 */

"use strict";

/**
 * Combines multiple className strings into one.
 * http://jsperf.com/joinclasses-args-vs-array
 *
 * @param {...?string} classes
 * @return {string}
 */
function joinClasses(className/*, ... */) {
  if (!className) {
    className = '';
  }
  var nextClass;
  var argLength = arguments.length;
  if (argLength > 1) {
    for (var ii = 1; ii < argLength; ii++) {
      nextClass = arguments[ii];
      nextClass && (className += ' ' + nextClass);
    }
  }
  return className;
}

module.exports = joinClasses;

},{}],"n1FgJb":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule keyMirror
 * @typechecks static-only
 */

"use strict";

var invariant = require("./invariant");

/**
 * Constructs an enumeration with keys equal to their value.
 *
 * For example:
 *
 *   var COLORS = keyMirror({blue: null, red: null});
 *   var myColor = COLORS.blue;
 *   var isColorValid = !!COLORS[myColor];
 *
 * The last line could not be performed if the values of the generated enum were
 * not equal to their keys.
 *
 *   Input:  {key1: val1, key2: val2}
 *   Output: {key1: key1, key2: key2}
 *
 * @param {object} obj
 * @return {object}
 */
var keyMirror = function(obj) {
  var ret = {};
  var key;
  invariant(obj instanceof Object && !Array.isArray(obj));
  for (key in obj) {
    if (!obj.hasOwnProperty(key)) {
      continue;
    }
    ret[key] = key;
  }
  return ret;
};

module.exports = keyMirror;

},{"./invariant":"hPxNWC"}],"Q4rOoG":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule keyOf
 */

/**
 * Allows extraction of a minified key. Let's the build system minify keys
 * without loosing the ability to dynamically use key strings as values
 * themselves. Pass in an object with a single key/val pair and it will return
 * you the string key of that single record. Suppose you want to grab the
 * value for a key 'className' inside of an object. Key/val minification may
 * have aliased that key to be 'xa12'. keyOf({className: null}) will return
 * 'xa12' in that case. Resolve keys you want to use once at startup time, then
 * reuse those resolutions.
 */
var keyOf = function(oneKeyObj) {
  var key;
  for (key in oneKeyObj) {
    if (!oneKeyObj.hasOwnProperty(key)) {
      continue;
    }
    return key;
  }
  return null;
};


module.exports = keyOf;

},{}],"w+d2Nh":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule memoizeStringOnly
 * @typechecks static-only
 */

"use strict";

/**
 * Memoizes the return value of a function that accepts one string argument.
 *
 * @param {function} callback
 * @return {function}
 */
function memoizeStringOnly(callback) {
  var cache = {};
  return function(string) {
    if (cache.hasOwnProperty(string)) {
      return cache[string];
    } else {
      return cache[string] = callback.call(this, string);
    }
  };
}

module.exports = memoizeStringOnly;

},{}],"7duoWY":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule merge
 */

"use strict";

var mergeInto = require("./mergeInto");

/**
 * Shallow merges two structures into a return value, without mutating either.
 *
 * @param {?object} one Optional object with properties to merge from.
 * @param {?object} two Optional object with properties to merge from.
 * @return {object} The shallow extension of one by two.
 */
var merge = function(one, two) {
  var result = {};
  mergeInto(result, one);
  mergeInto(result, two);
  return result;
};

module.exports = merge;

},{"./mergeInto":"1Kx0L6"}],"oewMNJ":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule mergeHelpers
 *
 * requiresPolyfills: Array.isArray
 */

"use strict";

var invariant = require("./invariant");
var keyMirror = require("./keyMirror");

/**
 * Maximum number of levels to traverse. Will catch circular structures.
 * @const
 */
var MAX_MERGE_DEPTH = 36;

/**
 * We won't worry about edge cases like new String('x') or new Boolean(true).
 * Functions are considered terminals, and arrays are not.
 * @param {*} o The item/object/value to test.
 * @return {boolean} true iff the argument is a terminal.
 */
var isTerminal = function(o) {
  return typeof o !== 'object' || o === null;
};

var mergeHelpers = {

  MAX_MERGE_DEPTH: MAX_MERGE_DEPTH,

  isTerminal: isTerminal,

  /**
   * Converts null/undefined values into empty object.
   *
   * @param {?Object=} arg Argument to be normalized (nullable optional)
   * @return {!Object}
   */
  normalizeMergeArg: function(arg) {
    return arg === undefined || arg === null ? {} : arg;
  },

  /**
   * If merging Arrays, a merge strategy *must* be supplied. If not, it is
   * likely the caller's fault. If this function is ever called with anything
   * but `one` and `two` being `Array`s, it is the fault of the merge utilities.
   *
   * @param {*} one Array to merge into.
   * @param {*} two Array to merge from.
   */
  checkMergeArrayArgs: function(one, two) {
    invariant(Array.isArray(one) && Array.isArray(two));
  },

  /**
   * @param {*} one Object to merge into.
   * @param {*} two Object to merge from.
   */
  checkMergeObjectArgs: function(one, two) {
    mergeHelpers.checkMergeObjectArg(one);
    mergeHelpers.checkMergeObjectArg(two);
  },

  /**
   * @param {*} arg
   */
  checkMergeObjectArg: function(arg) {
    invariant(!isTerminal(arg) && !Array.isArray(arg));
  },

  /**
   * Checks that a merge was not given a circular object or an object that had
   * too great of depth.
   *
   * @param {number} Level of recursion to validate against maximum.
   */
  checkMergeLevel: function(level) {
    invariant(level < MAX_MERGE_DEPTH);
  },

  /**
   * Checks that the supplied merge strategy is valid.
   *
   * @param {string} Array merge strategy.
   */
  checkArrayStrategy: function(strategy) {
    invariant(strategy === undefined || strategy in mergeHelpers.ArrayStrategies);
  },

  /**
   * Set of possible behaviors of merge algorithms when encountering two Arrays
   * that must be merged together.
   * - `clobber`: The left `Array` is ignored.
   * - `indexByIndex`: The result is achieved by recursively deep merging at
   *   each index. (not yet supported.)
   */
  ArrayStrategies: keyMirror({
    Clobber: true,
    IndexByIndex: true
  })

};

module.exports = mergeHelpers;

},{"./invariant":"hPxNWC","./keyMirror":"n1FgJb"}],"1Kx0L6":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule mergeInto
 * @typechecks static-only
 */

"use strict";

var mergeHelpers = require("./mergeHelpers");

var checkMergeObjectArg = mergeHelpers.checkMergeObjectArg;

/**
 * Shallow merges two structures by mutating the first parameter.
 *
 * @param {object} one Object to be merged into.
 * @param {?object} two Optional object with properties to merge from.
 */
function mergeInto(one, two) {
  checkMergeObjectArg(one);
  if (two != null) {
    checkMergeObjectArg(two);
    for (var key in two) {
      if (!two.hasOwnProperty(key)) {
        continue;
      }
      one[key] = two[key];
    }
  }
}

module.exports = mergeInto;

},{"./mergeHelpers":"oewMNJ"}],"qzQld6":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule mixInto
 */

"use strict";

/**
 * Simply copies properties to the prototype.
 */
var mixInto = function(constructor, methodBag) {
  var methodName;
  for (methodName in methodBag) {
    if (!methodBag.hasOwnProperty(methodName)) {
      continue;
    }
    constructor.prototype[methodName] = methodBag[methodName];
  }
};

module.exports = mixInto;

},{}],"XYM/FC":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule objMap
 */

"use strict";

/**
 * For each key/value pair, invokes callback func and constructs a resulting
 * object which contains, for every key in obj, values that are the result of
 * of invoking the function:
 *
 *   func(value, key, iteration)
 *
 * @param {?object} obj Object to map keys over
 * @param {function} func Invoked for each key/val pair.
 * @param {?*} context
 * @return {?object} Result of mapping or null if obj is falsey
 */
function objMap(obj, func, context) {
  if (!obj) {
    return null;
  }
  var i = 0;
  var ret = {};
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      ret[key] = func.call(context, obj[key], key, i++);
    }
  }
  return ret;
}

module.exports = objMap;

},{}],"863Jz9":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule objMapKeyVal
 */

"use strict";

/**
 * Behaves the same as `objMap` but invokes func with the key first, and value
 * second. Use `objMap` unless you need this special case.
 * Invokes func as:
 *
 *   func(key, value, iteration)
 *
 * @param {?object} obj Object to map keys over
 * @param {!function} func Invoked for each key/val pair.
 * @param {?*} context
 * @return {?object} Result of mapping or null if obj is falsey
 */
function objMapKeyVal(obj, func, context) {
  if (!obj) {
    return null;
  }
  var i = 0;
  var ret = {};
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      ret[key] = func.call(context, key, obj[key], i++);
    }
  }
  return ret;
}

module.exports = objMapKeyVal;

},{}],"CoHoju":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule performanceNow
 * @typechecks static-only
 */

"use strict";

var ExecutionEnvironment = require("./ExecutionEnvironment");

/**
 * Detect if we can use window.performance.now() and gracefully
 * fallback to Date.now() if it doesn't exist.
 * We need to support Firefox < 15 for now due to Facebook's webdriver
 * infrastructure.
 */
var performance = null;

if (ExecutionEnvironment.canUseDOM) {
  performance = window.performance || window.webkitPerformance;
}

if (!performance || !performance.now) {
  performance = Date;
}

var performanceNow = performance.now.bind(performance);

module.exports = performanceNow;

},{"./ExecutionEnvironment":"mrmvk9"}],"27ud2W":[function(require,module,exports){
/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule traverseAllChildren
 */

"use strict";

var ReactComponent = require("./ReactComponent");
var ReactTextComponent = require("./ReactTextComponent");

var invariant = require("./invariant");

/**
 * TODO: Test that:
 * 1. `mapChildren` transforms strings and numbers into `ReactTextComponent`.
 * 2. it('should fail when supplied duplicate key', function() {
 * 3. That a single child and an array with one item have the same key pattern.
 * });
 */

/**
 * @param {?*} children Children tree container.
 * @param {!string} nameSoFar Name of the key path so far.
 * @param {!number} indexSoFar Number of children encountered until this point.
 * @param {!function} callback Callback to invoke with each child found.
 * @param {?*} traverseContext Used to pass information throughout the traversal
 * process.
 * @return {!number} The number of children in this subtree.
 */
var traverseAllChildrenImpl =
  function(children, nameSoFar, indexSoFar, callback, traverseContext) {
    var subtreeCount = 0;  // Count of children found in the current subtree.
    if (Array.isArray(children)) {
      for (var i = 0; i < children.length; i++) {
        var child = children[i];
        var nextName = nameSoFar + ReactComponent.getKey(child, i);
        var nextIndex = indexSoFar + subtreeCount;
        subtreeCount += traverseAllChildrenImpl(
          child,
          nextName,
          nextIndex,
          callback,
          traverseContext
        );
      }
    } else {
      var type = typeof children;
      var isOnlyChild = nameSoFar === '';
      // If it's the only child, treat the name as if it was wrapped in an array
      // so that it's consistent if the number of children grows
      var storageName = isOnlyChild ?
        ReactComponent.getKey(children, 0):
        nameSoFar;
      if (children === null || children === undefined || type === 'boolean') {
        // All of the above are perceived as null.
        callback(traverseContext, null, storageName, indexSoFar);
        subtreeCount = 1;
      } else if (children.mountComponentIntoNode) {
        callback(traverseContext, children, storageName, indexSoFar);
        subtreeCount = 1;
      } else {
        if (type === 'object') {
          invariant(children || children.nodeType !== 1);
          for (var key in children) {
            if (children.hasOwnProperty(key)) {
              subtreeCount += traverseAllChildrenImpl(
                children[key],
                nameSoFar + '{' + key + '}',
                indexSoFar + subtreeCount,
                callback,
                traverseContext
              );
            }
          }
        } else if (type === 'string') {
          var normalizedText = new ReactTextComponent(children);
          callback(traverseContext, normalizedText, storageName, indexSoFar);
          subtreeCount += 1;
        } else if (type === 'number') {
          var normalizedNumber = new ReactTextComponent('' + children);
          callback(traverseContext, normalizedNumber, storageName, indexSoFar);
          subtreeCount += 1;
        }
      }
    }
    return subtreeCount;
  };

/**
 * Traverses children that are typically specified as `props.children`, but
 * might also be specified through attributes:
 *
 * - `traverseAllChildren(this.props.children, ...)`
 * - `traverseAllChildren(this.props.leftPanelChildren, ...)`
 *
 * The `traverseContext` is an optional argument that is passed through the
 * entire traversal. It can be used to store accumulations or anything else that
 * the callback might find relevant.
 *
 * @param {?*} children Children tree object.
 * @param {!function} callback To invoke upon traversing each child.
 * @param {?*} traverseContext Context for traversal.
 */
function traverseAllChildren(children, callback, traverseContext) {
  if (children !== null && children !== undefined) {
    traverseAllChildrenImpl(children, '', 0, callback, traverseContext);
  }
}

module.exports = traverseAllChildren;

},{"./ReactComponent":"RDDX+O","./ReactTextComponent":"/gjL2v","./invariant":"hPxNWC"}],"ReactPropTypes":[function(require,module,exports){
module.exports=require('9axgbZ');
},{}],"Arbiter":[function(require,module,exports){
module.exports=require('cWvVP8');
},{}],"mixins/ArbiterMixin":[function(require,module,exports){
module.exports=require('4vB33x');
},{}],"EventPluginRegistry":[function(require,module,exports){
module.exports=require('bKyk3V');
},{}],"ReactPropTransferer":[function(require,module,exports){
module.exports=require('K6UoEF');
},{}],"EventPluginHub":[function(require,module,exports){
module.exports=require('EddLdT');
},{}],"1msWMR":[function(require,module,exports){
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
},{"Dispatcher":"Jxf8r5","Store":"56S4uO"}],"EventConstants":[function(require,module,exports){
module.exports=require('Gaqr6V');
},{}],"ReactReconcileTransaction":[function(require,module,exports){
module.exports=require('38o64s');
},{}],"EnterLeaveEventPlugin":[function(require,module,exports){
module.exports=require('NAAuN8');
},{}],"EventStore":[function(require,module,exports){
module.exports=require('1msWMR');
},{}],"DefaultEventPluginOrder":[function(require,module,exports){
module.exports=require('rrDzGt');
},{}],"ReactServerRendering":[function(require,module,exports){
module.exports=require('JvdSDI');
},{}],"DefaultDOMPropertyConfig":[function(require,module,exports){
module.exports=require('lojxFf');
},{}],"Store":[function(require,module,exports){
module.exports=require('56S4uO');
},{}],"Danger":[function(require,module,exports){
module.exports=require('M4LxPz');
},{}],"ReactTextComponent":[function(require,module,exports){
module.exports=require('/gjL2v');
},{}],"DOMPropertyOperations":[function(require,module,exports){
module.exports=require('n+MrOf');
},{}],"Dispatcher":[function(require,module,exports){
module.exports=require('Jxf8r5');
},{}],"DOMProperty":[function(require,module,exports){
module.exports=require('fduHX3');
},{}],"ReactUpdates":[function(require,module,exports){
module.exports=require('dwYRw4');
},{}],"DOMChildrenOperations":[function(require,module,exports){
module.exports=require('a0oMnh');
},{}],"objMapKeyVal":[function(require,module,exports){
module.exports=require('863Jz9');
},{}],"ChangeEventPlugin":[function(require,module,exports){
module.exports=require('KJ8HU6');
},{}],"SyntheticEvent":[function(require,module,exports){
module.exports=require('L5ht1h');
},{}],"CSSPropertyOperations":[function(require,module,exports){
module.exports=require('BlPn6+');
},{}],"objMap":[function(require,module,exports){
module.exports=require('XYM/FC');
},{}],"$":[function(require,module,exports){
module.exports=require('9iYy0C');
},{}],"WLDCvt":[function(require,module,exports){
/** @jsx React.DOM */
var React = require('React');
var ArbiterMixin = require('mixins/ArbiterMixin');

var Header = require('Header');
var Events = require('Events');

var EventStore = require('EventStore');

var Application = React.createClass({displayName: 'Application',
  mixins: [ArbiterMixin],

  getInitialState: function () {
    return {
      events: [],
      loggedIn: 'connected'
    };
  },

  componentWillMount: function () {
    this.publish('init', {});

    EventStore.subscribe('loadedEvents', this.loadedEvents);
    EventStore.subscribe('rsvpUpdate', this.rsvpUpdate);
    EventStore.subscribe('loginChange', this.handleLoginChange);
  },

  loadedEvents: function (payload) {
    var events = payload.events.slice(0,60);
    this.setState({
      events: events
    });
  },

  handleLoginChange: function (payload) {
    var loggedIn = payload.loggedIn;
    this.setState({
      loggedIn : loggedIn
    });
  },
  
  render: function () {
    var loginClass = "loginNotice " + (this.state.loggedIn === 'connected' ? "hide" : "");
    return (
      React.DOM.div( {className:"Application"}, 
        Header(null ),
        React.DOM.h1( {className:loginClass}, "Login to Facebook to see upcoming events"),
        Events( {events:this.state.events})
      )
    );
  }
});

module.exports = Application;
},{"EventStore":"1msWMR","Events":"FbWSBG","Header":"lPO+H4","React":"53xxmY","mixins/ArbiterMixin":"4vB33x"}],"FbWSBG":[function(require,module,exports){
/** @jsx React.DOM */
var React = require('React');
var ArbiterMixin = require('mixins/ArbiterMixin');

var Tableslip = require('Tableslip');

var Events = React.createClass({displayName: 'Events',
  mixins: [ArbiterMixin],

  componentDidMount: function () {
    // var events = this.refs.Events.getDOMNode();
    // this.iso = new Isotope(events, {
    //   isInitLayout: false,
    //   itemSelector: '.Tableslip',
    //   masonry: {
    //     isFitWidth: true
    //   }
    // });

    this.refresh();
  },

  componentDidUpdate: function () {
    this.refresh();
  },

  refresh: function () {
    // this.iso.reloadItems();
    // this.iso.arrange();
  },
  
  render: function () {

    var events = this.props.events.map(function(event) {
      return Tableslip( {event:event});
    });

    return (
      React.DOM.div( {ref:"Events", className:"Events"}, 
        events
      )
    );
  }
});

module.exports = Events;
},{"React":"53xxmY","Tableslip":"BX3Qr7","mixins/ArbiterMixin":"4vB33x"}],"QDHGTP":[function(require,module,exports){
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
},{"Keyword":"WIV9q4","React":"53xxmY","mixins/ArbiterMixin":"4vB33x"}],"ll/2ER":[function(require,module,exports){
/** @jsx React.DOM */

var React = require('React');
var ArbiterMixin = require('mixins/ArbiterMixin');

/** Stores */

/** Components */

var Footer = React.createClass({displayName: 'Footer',
  mixins: [ArbiterMixin],

  componentWillMount: function () {
    /** Subscribe to events */
  },
  
  render: function () {
    return (
      React.DOM.div( {className:"Footer"}, 
        React.DOM.div( {className:"fb-login-button", 'data-width':"200", 'data-autologoutlink':"true", 'data-scope':"user_events, friends_events"})
      )
    );
  }
});

module.exports = Footer;
},{"React":"53xxmY","mixins/ArbiterMixin":"4vB33x"}],"lPO+H4":[function(require,module,exports){
/** @jsx React.DOM */

var React = require('React');
var ArbiterMixin = require('mixins/ArbiterMixin');

var Logo = require('Logo');
var Filters = require('Filters');

var EventStore = require('EventStore');

var Header = React.createClass({displayName: 'Header',
  mixins: [ArbiterMixin],
  
  render: function () {
    return (
      React.DOM.div( {className:"Header"}, 
        Logo(null ),
        Filters(null ),
        React.DOM.div( {className:"fb-login-button-wrapper"}, 
          React.DOM.div( {className:"fb-login-button", 'data-size':"icon", 'data-autologoutlink':"true", 'data-scope':"user_events, friends_events, rsvp_event"})
        )
      )
    );
  }
});

module.exports = Header;
},{"EventStore":"1msWMR","Filters":"QDHGTP","Logo":"AJg5N/","React":"53xxmY","mixins/ArbiterMixin":"4vB33x"}],"WIV9q4":[function(require,module,exports){
/** @jsx React.DOM */

var React = require('React');
var ArbiterMixin = require('mixins/ArbiterMixin');

var Keyword = React.createClass({displayName: 'Keyword',
  mixins: [ArbiterMixin],

  select: function () {
    if (!this.props.disabled) {
      this.props.filter(this.props.name, !this.props.selected);
    }
  },

  render: function () {
    var disabled = this.props.disabled ? " disabled" : "";
    var selectedClass = this.props.selected ? " selected" : "";

    return (
      React.DOM.div( {className:"Keyword" + selectedClass + disabled, onClick:this.select}, 
      this.props.children
      )
    );
  }
});

module.exports = Keyword;
},{"React":"53xxmY","mixins/ArbiterMixin":"4vB33x"}],"AJg5N/":[function(require,module,exports){
/** @jsx React.DOM */

var React = require('React');
var ArbiterMixin = require('mixins/ArbiterMixin');

var Logo = React.createClass({displayName: 'Logo',
  mixins: [ArbiterMixin],

  componentWillMount: function () {
    EventStore.subscribe('loginChange', this.handleLoginChange);
    EventStore.subscribe('loadedEvents', this.handleLoadedEvents);
  },

  getInitialState: function () {
    return {
      loadedEvents: false
    };
  },

  handleLoadedEvents: function (data) {
    if (!data.cached) {
      this.setState({
        loadedEvents: true
      });
    }
  },

  handleLoginChange: function (payload) {
    var loggedIn = payload.loggedIn;
    this.setState({
      loggedIn : loggedIn
    });
  },
  
  render: function () {
    var spinnerClass = "spinner " + (this.state.loggedIn !== 'connected' || this.state.loadedEvents ? "hide" : "");

    return (
      React.DOM.div( {className:"Logo"}, 
      	React.DOM.span( {className:spinnerClass}),
" Tableslip "      )
    );
  }
});

module.exports = Logo;
},{"React":"53xxmY","mixins/ArbiterMixin":"4vB33x"}],"gq8/iv":[function(require,module,exports){
/** @jsx React.DOM */

var React = require('React');
var ArbiterMixin = require('mixins/ArbiterMixin');

/** Stores */

/** Components */

var Rsvp = React.createClass({displayName: 'Rsvp',
  mixins: [ArbiterMixin],

  getInitialState: function () {
    return {
      rsvp_status: this.props.rsvp_status
    };
  },

  componentWillMount: function () {
    /** Subscribe to events */
    Dispatcher.subscribe('rsvpUpdate/' + this.props.eventID, this.rsvpUpdate);
  },

  rsvp: function (rsvp_status) {
    this.publish('rsvp', {
      eventID: this.props.eventID,
      rsvp_status: rsvp_status,
    });
  },

  rsvpUpdate: function (data) {
    var rsvp_status = data.rsvp_status;
    this.setState({
      rsvp_status: rsvp_status
    });
  },

  going: function (event) {
    event.preventDefault();
    this.rsvp('attending');    
  },
  
  maybe: function (event) {
    event.preventDefault();
    this.rsvp('maybe');
  },

  notGoing: function (event) {
    event.preventDefault();
    this.rsvp('declined');
  },

  render: function () {
    var goingClass = this.state.rsvp_status === "attending" ? " active" : "";
    var maybeClass = this.state.rsvp_status === "maybe" ? " active" : "";
    var notGoingClass = this.state.rsvp_status === "declined" ? " active" : "";

    return (
      React.DOM.div( {className:"Rsvp"}, 
        React.DOM.div( {onClick:this.going, className:"rsvpButton" + goingClass}, "Going"),
        React.DOM.div( {onClick:this.maybe, className:"rsvpButton" + maybeClass}, "Maybe"),
        React.DOM.div( {onClick:this.notGoing, className:"rsvpButton" + notGoingClass}, "Not Going")
      )
    );
  }
});

module.exports = Rsvp;
},{"React":"53xxmY","mixins/ArbiterMixin":"4vB33x"}],"SyntheticFocusEvent":[function(require,module,exports){
module.exports=require('ucaFnA');
},{}],"BX3Qr7":[function(require,module,exports){
/** @jsx React.DOM */

var React = require('React');
var ArbiterMixin = require('mixins/ArbiterMixin');

var Rsvp = require('Rsvp');

var Tableslip = React.createClass({displayName: 'Tableslip',
  mixins: [ArbiterMixin],
  
  render: function () {
    var date = moment(this.props.event.start_time);
    var friends = this.props.event.friends || {};
    var pics = Object.keys(friends).slice(0,5).map(function(friendID) {
      return React.DOM.span( {className:"tooltip", 'data-hint':friends[friendID].name}, React.DOM.img( {className:"profilePic", src:"https://graph.facebook.com/" + friendID + "/picture", alt:"friend picture"}));
    });

    var more = this.props.event.count - pics.length;
    if (more) {
      var moreFriends = Object.keys(friends).slice(5).map(function(friendID) {
        return friends[friendID].name;
      });
      var count = React.DOM.span( {className:"tooltip", 'data-hint':moreFriends.join("\n")}, React.DOM.div( {className:"profilePic count"}, "+" + more));
    };

    var invited = this.props.event.invited ? " Invited" : "";

    if (this.props.event.cover) {
      var backgroundStyle = {
        'background': 'url(' + this.props.event.cover + ')'    
      };
    }

    var name = this.props.event.name.length > 120 ? this.props.event.name.substring(0,120) + '. . .' : this.props.event.name;

    return (
      React.DOM.a( {href:"http://www.facebook.com/" + this.props.event.id, className:"Tableslip " + date.format('ddd') + invited}, 
        React.DOM.div( {className:"background", style:backgroundStyle} ),
        React.DOM.div( {className:"foreground"}, 
          React.DOM.div( {className:"name"}, name),
          React.DOM.div( {className:"group"}, this.props.event.parent_group),
          React.DOM.div( {className:"day"}, date.format('dddd MMMM Do')),
          React.DOM.div( {className:"time"}, date.format('h:mm a')),
          Rsvp( {eventID:this.props.event.id, rsvp_status:this.props.event.rsvp_status} ),
          React.DOM.div( {className:"friends"}, 
            React.DOM.div( {className:"facepile"}, 
              pics,
              count
            )
          )
        )
      )
    );
  }
});

module.exports = Tableslip;
},{"React":"53xxmY","Rsvp":"gq8/iv","mixins/ArbiterMixin":"4vB33x"}],"keyOf":[function(require,module,exports){
module.exports=require('Q4rOoG');
},{}],"Tableslip":[function(require,module,exports){
module.exports=require('BX3Qr7');
},{}],"SyntheticMutationEvent":[function(require,module,exports){
module.exports=require('FactSb');
},{}],"ReactDefaultInjection":[function(require,module,exports){
module.exports=require('oRxGN0');
},{}],"joinClasses":[function(require,module,exports){
module.exports=require('odpU/7');
},{}],"Events":[function(require,module,exports){
module.exports=require('FbWSBG');
},{}],"SyntheticTouchEvent":[function(require,module,exports){
module.exports=require('49cVaj');
},{}],"Filters":[function(require,module,exports){
module.exports=require('QDHGTP');
},{}],"invariant":[function(require,module,exports){
module.exports=require('hPxNWC');
},{}],"Application":[function(require,module,exports){
module.exports=require('WLDCvt');
},{}],"SyntheticUIEvent":[function(require,module,exports){
module.exports=require('unRgeP');
},{}],"ReactDefaultBatchingStrategy":[function(require,module,exports){
module.exports=require('FN7wZd');
},{}],"hyphenate":[function(require,module,exports){
module.exports=require('lqHdFC');
},{}],"Rsvp":[function(require,module,exports){
module.exports=require('gq8/iv');
},{}],"SyntheticWheelEvent":[function(require,module,exports){
module.exports=require('MH4TbT');
},{}],"ReactDOMTextarea":[function(require,module,exports){
module.exports=require('omUt5u');
},{}],"getReactRootElementInContainer":[function(require,module,exports){
module.exports=require('sz+OE9');
},{}],"Keyword":[function(require,module,exports){
module.exports=require('WIV9q4');
},{}],"Transaction":[function(require,module,exports){
module.exports=require('aekoY0');
},{}],"Header":[function(require,module,exports){
module.exports=require('lPO+H4');
},{}],"ge":[function(require,module,exports){
module.exports=require('7THwY4');
},{}],"Logo":[function(require,module,exports){
module.exports=require('AJg5N/');
},{}],"accumulate":[function(require,module,exports){
module.exports=require('rpm6kU');
},{}],"ReactDOMSelect":[function(require,module,exports){
module.exports=require('gA/to5');
},{}],"forEachAccumulated":[function(require,module,exports){
module.exports=require('pcy7SL');
},{}],"Footer":[function(require,module,exports){
module.exports=require('ll/2ER');
},{}],"createNodesFromMarkup":[function(require,module,exports){
module.exports=require('iqoonm');
},{}],"main":[function(require,module,exports){
module.exports=require('1zpOES');
},{}],"ex":[function(require,module,exports){
module.exports=require('bHKEgX');
},{}],"EventPropagators":[function(require,module,exports){
module.exports=require('n/zMdI');
},{}],"dangerousStyleValue":[function(require,module,exports){
module.exports=require('vbLjBj');
},{}],"React":[function(require,module,exports){
module.exports=require('53xxmY');
},{}],"createObjectFrom":[function(require,module,exports){
module.exports=require('OocYg9');
},{}],"ReactComponentBrowserEnvironment":[function(require,module,exports){
module.exports=require('+VDCcA');
},{}],"SimpleEventPlugin":[function(require,module,exports){
module.exports=require('vsWsrL');
},{}],"ReactComponentEnvironment":[function(require,module,exports){
module.exports=require('kOHKbO');
},{}],"createArrayFrom":[function(require,module,exports){
module.exports=require('HDEmgB');
},{}],"ReactDOMForm":[function(require,module,exports){
module.exports=require('2ZgJdE');
},{}],"emptyFunction":[function(require,module,exports){
module.exports=require('RxjlFd');
},{}],"ReactCompositeComponent":[function(require,module,exports){
module.exports=require('nAvIQF');
},{}],"copyProperties":[function(require,module,exports){
module.exports=require('M+gx0D');
},{}],"ReactDOMInput":[function(require,module,exports){
module.exports=require('e8EEBl');
},{}],"escapeTextForBrowser":[function(require,module,exports){
module.exports=require('ZaIegL');
},{}],"mixInto":[function(require,module,exports){
module.exports=require('qzQld6');
},{}],"adler32":[function(require,module,exports){
module.exports=require('5ukn/R');
},{}],"memoizeStringOnly":[function(require,module,exports){
module.exports=require('w+d2Nh');
},{}],"flattenChildren":[function(require,module,exports){
module.exports=require('cza1WC');
},{}],"ReactDefaultPerf":[function(require,module,exports){
module.exports=require('MTKS4R');
},{}],"ViewportMetrics":[function(require,module,exports){
module.exports=require('sk6wio');
},{}],"ReactEventEmitterMixin":[function(require,module,exports){
module.exports=require('cwSdrc');
},{}],"getEventTarget":[function(require,module,exports){
module.exports=require('eoIwTT');
},{}],"ReactInstanceHandles":[function(require,module,exports){
module.exports=require('owd960');
},{}],"ReactPerf":[function(require,module,exports){
module.exports=require('S6hUyz');
},{}],"ReactMount":[function(require,module,exports){
module.exports=require('1R+7Eu');
},{}],"getTextContentAccessor":[function(require,module,exports){
module.exports=require('Suh93r');
},{}],"ReactMultiChildUpdateTypes":[function(require,module,exports){
module.exports=require('1fqbih');
},{}],"ReactInputSelection":[function(require,module,exports){
module.exports=require('eT7xLu');
},{}],"ReactOnDOMReady":[function(require,module,exports){
module.exports=require('rkZBuo');
},{}],"isEventSupported":[function(require,module,exports){
module.exports=require('Iv78kc');
},{}],"EventPluginUtils":[function(require,module,exports){
module.exports=require('K4QB+L');
},{}],"ReactCurrentOwner":[function(require,module,exports){
module.exports=require('j7aNlU');
},{}],"ReactChildren":[function(require,module,exports){
module.exports=require('7bESex');
},{}],"keyMirror":[function(require,module,exports){
module.exports=require('n1FgJb');
},{}],"ReactDOMButton":[function(require,module,exports){
module.exports=require('0sS+Uk');
},{}],"PooledClass":[function(require,module,exports){
module.exports=require('5mz1Gs');
},{}],"ReactDOMIDOperations":[function(require,module,exports){
module.exports=require('nRDvnf');
},{}],"getMarkupWrap":[function(require,module,exports){
module.exports=require('a26iu1');
},{}],"SyntheticKeyboardEvent":[function(require,module,exports){
module.exports=require('oNOIlC');
},{}],"ExecutionEnvironment":[function(require,module,exports){
module.exports=require('mrmvk9');
},{}],"ReactEventEmitter":[function(require,module,exports){
module.exports=require('qPIJ8M');
},{}],"merge":[function(require,module,exports){
module.exports=require('7duoWY');
},{}],"ReactMarkupChecksum":[function(require,module,exports){
module.exports=require('TUHHsM');
},{}],"EventListener":[function(require,module,exports){
module.exports=require('e0NKSL');
},{}],"ReactNativeComponent":[function(require,module,exports){
module.exports=require('g13zJS');
},{}],"mergeHelpers":[function(require,module,exports){
module.exports=require('oewMNJ');
},{}],"MobileSafariClickEventPlugin":[function(require,module,exports){
module.exports=require('OHn5BI');
},{}],"CallbackRegistry":[function(require,module,exports){
module.exports=require('L1h3na');
},{}],"ReactDOM":[function(require,module,exports){
module.exports=require('6GzACJ');
},{}],"mergeInto":[function(require,module,exports){
module.exports=require('1Kx0L6');
},{}],"SyntheticMouseEvent":[function(require,module,exports){
module.exports=require('v7zPvJ');
},{}],"ReactMultiChild":[function(require,module,exports){
module.exports=require('UlnLr0');
},{}],"traverseAllChildren":[function(require,module,exports){
module.exports=require('27ud2W');
},{}],"Lawnchair":[function(require,module,exports){
module.exports=require('HPHWXz');
},{}],"performanceNow":[function(require,module,exports){
module.exports=require('CoHoju');
},{}],"CSSProperty":[function(require,module,exports){
module.exports=require('sWBULG');
},{}],"ReactOwner":[function(require,module,exports){
module.exports=require('YwelYh');
},{}],"ReactEventTopLevelCallback":[function(require,module,exports){
module.exports=require('f4CWDK');
},{}],"ReactDOMOption":[function(require,module,exports){
module.exports=require('Kfaqkr');
},{}],"ReactComponent":[function(require,module,exports){
module.exports=require('RDDX+O');
},{}]},{},["1zpOES"])
;