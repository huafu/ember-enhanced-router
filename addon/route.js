import Ember from 'ember';

import './ember-overrides';

function prefix(key) {
  return '$$EER$$' + key;
}

function cleanPath(path) {
  return path.replace(/(?:^\/|\/$)/g, '');
}

function defaultFormatter(tokens) {
  return tokens.join(' - ');
}

function humanize(string) {
  return Ember.String.dasherize(string || '')
    .replace(/[_-]+/g, ' ')
    .replace(/(\w+)/g, Ember.String.capitalize);
}

/**
 * Build the Ember expected map for a route
 *
 * @module ember-enhanced-router
 * @function route
 * @param {string|RouteMeta} [name=null] The name of the route with an optional path after `@`, or null for application route
 * @param {string|Function} [titleToken] The title token for that route, or a function to create it
 * @param {{resetTitle: boolean}} [options] Options
 * @return {RouteMeta}
 */
function route(name, titleToken, options) {
  var path, match;
  if (name instanceof RouteMeta) {
    return name;
  }
  if (name) {
    match = name.match(/^([^@]+)(?:@(.*))?$/);
    name = match[1];
    path = match[2];
    if (path === undefined) {
      path = name === 'index' ? '/' : name;
    }
    else if (path === '') {
      path = '/';
    }
    else if (path === '*') {
      path = '/*wildcard';
    }
  }
  else {
    path = '/';
  }
  return new RouteMeta(name, path, titleToken, options);
}

/**
 * @class RouteMeta
 * @param {string} name
 * @param {string} path
 * @param {string} titleToken
 * @param {{resetTitle: boolean}} options
 * @constructor
 */
function RouteMeta(name, path, titleToken, options) {
  this.name = name || 'application';
  this.parent = null;
  this.route = null;
  this.controller = null;
  this.path = path;
  this.cleanPath = cleanPath(path);
  this.isIndex = this.cleanPath === '';
  this.titleToken = titleToken;
  this.options = options || {};
  this.children = Ember.A([]);
  this.childrenByName = Object.create(null);
  this.childrenByPath = Object.create(null);
  this.isResource = !name;
  this.isActive = false;
}

/**
 * Register the route corresponding to this meta, as well as the controller
 *
 * @method registerRoute
 * @param route
 */
RouteMeta.prototype.registerRoute = function (route) {
  this.route = route;
  this.controller = route.controllerFor(route.controllerName || route.routeName);
};

/**
 * Computed the title of the document for this route
 *
 * @method _title
 * @returns {string}
 * @private
 */
RouteMeta.prototype._title = function () {
  var tokens = [], current = this, formatter, grabTokens = true, token;
  while (current && (!formatter || grabTokens)) {
    if (grabTokens) {
      token = current.computeTitleToken();
      if (token) {
        if (!Ember.isArray(tokens)) {
          token = [token];
        }
        tokens.unshift.apply(tokens, token);
      }
      if (current.options.resetTitle) {
        grabTokens = false;
      }
    }
    if (!formatter && current.controller.documentTitleFormatter) {
      formatter = current.controller.documentTitleFormatter;
    }
    current = current.parent;
  }
  tokens = Ember.A(tokens).filter(Boolean);
  return (formatter || defaultFormatter)(tokens);
};

/**
 * Get the computed title token, setting it up if not yet done
 *
 * @method computeTitleToken
 * @returns {string}
 */
RouteMeta.prototype.computeTitleToken = function () {
  if (this.titleToken === false) {
    return null;
  }
  this.setupTitleToken();
  // just get the computed property value.
  return this._ttp.get('_realTitleToken');
};

/**
 * Adds an ember observer to be triggered when the title changes
 *
 * @method addTitleObserver
 * @param {Object} [target]
 * @param {string|Function} method
 * @param {*} [args...]
 */
RouteMeta.prototype.addTitleObserver = function () {
  var args = Array.prototype.slice.call(arguments);
  args.unshift('_fullTitle');
  this.setupTitleToken();
  return this._ttp.addObserver.apply(this._ttp, args);
};

/**
 * Removes an ember observer which was triggered when the title change
 *
 * @method removeTitleObserver
 * @param {Object} [target]
 * @param {string|Function} method
 * @param {*} [args...]
 */
RouteMeta.prototype.removeTitleObserver = function () {
  var args = Array.prototype.slice.call(arguments);
  args.unshift('_fullTitle');
  this.setupTitleToken();
  return this._ttp.removeObserver.apply(this._ttp, args);
};

/**
 * Setup the title token
 *
 * @method setupTitleToken
 */
RouteMeta.prototype.setupTitleToken = function () {
  var tokenCP, defaultToken, props, originalTitleToken, computed = Ember.computed, meta = this;
  if (!this._ttp) {
    // build the title computed property
    defaultToken = this.isIndexRoute() ? null : humanize(this.name);
    originalTitleToken = this.titleToken;
    if (originalTitleToken == null) {
      // default using the humanized version of the route name
      tokenCP = computed(function () {
        return defaultToken;
      });
    }
    else if (originalTitleToken instanceof Ember.ComputedProperty) {
      // it is already a computed property
      tokenCP = originalTitleToken;
    }
    else if (typeof originalTitleToken === 'function') {
      // it is a function, make it a computed property volatile
      tokenCP = computed(originalTitleToken).volatile();
    }
    else {
      // compile the title token
      props = [];
      // not care about result, just the callback
      originalTitleToken.replace(/\{\{([^}]+)}}/, function (dummy, path) {
        props.push(path);
      });
      tokenCP = props.concat([function () {
        var _this = this;
        return originalTitleToken.replace(/\{\{([^}]+)}}/, function (dummy, path) {
          return _this.get(path);
        });
      }]);
    }
    // create our class and the computed properties for it, then create our object

    this._ttp = Ember.ObjectProxy.extend({
      _defaultTitleToken: tokenCP,
      _realTitleToken:    computed('_defaultTitleToken', 'content.documentTitleToken', function () {
        var token = this.get('content.documentTitleToken');
        return token === false ? null : (token || this.get('_defaultTitleToken'));
      }),
      _fullTitle:         computed('_parentTitleTokenObject._fullTitle', '_realTitleToken', function () {
        return meta._ttp ? meta._title() : null;
      })
    }).create({
      content:                 this.controller,
      _parentTitleTokenObject: this.parent ? this.parent.setupTitleToken() : null
    });
  }
  return this._ttp;
};

/**
 * Gets the ful title for this route
 *
 * @method title
 * @returns {string}
 */
RouteMeta.prototype.title = function () {
  return this.setupTitleToken().get('_fullTitle');
};


/**
 * Finds whether this the index route of parent resource
 *
 * @method isIndexRoute
 * @returns {boolean}
 */
RouteMeta.prototype.isIndexRoute = function () {
  return !this.isResource && this.isIndex;
};

/**
 * Finds whether this is a wildcard route
 *
 * @method isWildcard
 * @returns {boolean}
 */
RouteMeta.prototype.isWildcard = function () {
  return this.cleanPath === '*wildcard';
};

/**
 * Returns the child which is the index of this route
 *
 * @method childIndexRoute
 * @returns {RouteMeta}
 */
RouteMeta.prototype.childIndexRoute = function () {
  return this.childForPath('/');
};

/**
 * The method doing the call as Router.map is expecting
 *
 * @method map
 * @param {Ember.Router.recognizer} target
 */
RouteMeta.prototype.map = function (target) {
  if (this.isResource && !this.childIndexRoute()) {
    // add index route if it does not exist
    this._route('index');
  }
  this.children.forEach(function (meta) {
    var args = [meta.name, {path: meta.path}], kind = meta.isResource ? 'resource' : 'route';
    if (meta.isResource) {
      args.push(meta.mapFunction());
    }
    console[meta.isResource && console.group ? 'group' : 'log'](
      '[enhanced-router] defining ' + kind + ' `' + meta.name + '` + with path `' + meta.path + '`'
    );
    target[kind].apply(target, args);
    if (meta.isResource && console.group) {
      console.groupEnd();
    }
  });
};

/**
 * Get the function used to map with ember router
 *
 * @method mapFunction
 * @returns {Function}
 */
RouteMeta.prototype.mapFunction = function () {
  var _this = this;
  return function () {
    _this.map(this);
  };
};

/**
 * Get the full name of this route
 *
 * @method fullName
 * @returns {string}
 */
RouteMeta.prototype.fullName = function () {
  var segments, current;
  if (!this._fullName) {
    segments = [];
    current = this;
    if (!current.parent) {
      return current.name;
    }
    while (current.parent) {
      segments.unshift(current.name);
      current = current.parent;
    }
    this._fullName = segments.join('.');
  }
  return this._fullName;
};

/**
 * Get the full path of this route
 *
 * @method fullPath
 * @returns {string}
 */
RouteMeta.prototype.fullPath = function () {
  var segments, current;
  if (!this._fullPath) {
    segments = [];
    current = this;
    while (current.parent) {
      segments.unshift(current.cleanPath);
      current = current.parent;
    }
    this._fullPath = Ember.A(segments).filter(Boolean).join('/');
  }
  return this._fullPath;
};

/**
 * Get the root route
 *
 * @method root
 * @returns {RouteMeta}
 */
RouteMeta.prototype.root = function () {
  if (!this._root) {
    if (this.parent) {
      this._root = this.parent.root();
    }
    else {
      this._root = this;
    }
  }
  return this._root;
};

/**
 * Defines this route as a resource
 *
 * @method asResource
 * @chainable
 */
RouteMeta.prototype.asResource = function () {
  this.isResource = true;
  return this;
};

/**
 * Returns the direct child for given path
 *
 * @method childForPath
 * @param {string} path
 * @returns {RouteMeta}
 */
RouteMeta.prototype.childForPath = function (path) {
  return this.childrenByPath[prefix(cleanPath(path))];
};

/**
 * Returns the direct child for given name
 *
 * @method childForName
 * @param {string} name
 * @returns {RouteMeta}
 */
RouteMeta.prototype.childForName = function (name) {
  return this.childrenByName[prefix(name)];
};


/**
 * Define a child-route to this route
 *
 * @method route
 * @param {string|RouteMeta} name
 * @param {string} [titleToken]
 * @param {{resetTitle: boolean}} [options]
 * @chainable
 */
RouteMeta.prototype._route = function (name, titleToken, options) {
  var child = route(name, titleToken, options);
  child.parent = this;
  this.asResource();
  this.children.push(child);
  this.childrenByName[prefix(child.name)] = child;
  this.childrenByPath[prefix(child.cleanPath)] = child;
  return this;
};

/**
 * Define many child-routes to this route
 *
 * @method routes
 * @params {RouteMeta} [meta...]
 * @chainable
 */
RouteMeta.prototype.routes = function () {
  var routes = Array.prototype.slice.call(arguments);
  if (routes.length) {
    Ember.A(routes).forEach(function (child) {
      this._route(child);
    }, this);
  }
  else {
    this.asResource();
  }
  return this;
};

/**
 * Returns the string representation of this meta
 *
 * @returns {string}
 */
RouteMeta.prototype.toString = function () {
  return this.fullName() + '[' + this.fullPath() + ']';
};

/**
 * Transforms this RouteMeta into an Ember router
 *
 * @method toRouter
 * @param {Object} options
 * @return {Ember.Router}
 */
RouteMeta.prototype.toRouter = function (options) {
  var Router;
  options = options || {};
  if (this.parent) {
    throw new Error('Only the root route may be exported as an Ember router.');
  }
  options._enhancedRouterRootMeta = this;
  Router = Ember.Router.extend(options);
  Router.map(this.mapFunction());
  return Router;
};

export default route;

