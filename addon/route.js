import Ember from 'ember';
import './ember-overrides';

var computed = Ember.computed;
var readOnly = computed.readOnly;

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
  return RouteMeta.create({
    name:             name || 'application',
    path:             path,
    routerTitleToken: titleToken,
    options:          options || {}
  });
}

/**
 * @class RouteMeta
 */
var RouteMeta = Ember.Object.extend({
  /**
   * Name of this route
   * @property name
   * @type {string}
   */
  name: null,

  /**
   * Parent meta
   * @property parent
   * @type {RouteMeta}
   */
  parent: null,

  /**
   * Route object
   * @property route
   * @type {Ember.Route}
   */
  route: null,

  /**
   * Controller for this route
   * @property controller
   * @type {Ember.Controller}
   */
  controller: computed('route', function () {
    var route = this.get('route');
    if (route) {
      return route.controllerFor(route.controllerName || route.routeName);
    }
  }).readOnly(),

  /**
   * Path of the route
   * @property path
   * @type {string}
   */
  path: null,

  /**
   * Clean path of the route
   * @property cleanPath
   * @type {string}
   */
  cleanPath: computed('path', function () {
    return cleanPath(this.get('path'));
  }),

  /**
   * Is this route an index (path is '/')?
   * @property isIndex
   * @type {boolean}
   */
  isIndex: computed('cleanPath', function () {
    return this.get('cleanPath') === '';
  }),

  /**
   * The titleToken as defined in the router
   * @property routerTitleToken
   * @type {string|Function}
   */
  routerTitleToken: null,

  /**
   * Options for the route
   * @property options
   * @type {{resetTitle: boolean}}
   */
  options: null,

  /**
   * The children of this meta
   * @property children
   * @type {Ember.Array}
   */
  children: computed(function () {
    return Ember.A([]);
  }).readOnly(),

  /**
   * Are we a resource?
   * @property isResource
   * @type {boolean}
   */
  isResource: computed(function (key, value) {
    return arguments.length > 1 ? value : !this.get('parent');
  }),

  /**
   * Are we a route and not a resource?
   * @property isRoute
   * @type {boolean}
   */
  isRoute: computed.not('isResource'),


  /**
   * Computed title token
   * @property titleToken
   * @type {string}
   */
  titleToken: readOnly('_titleBuilder._realTitleToken'),


  /**
   * Full title
   * @property fullTitle
   * @type {string}
   */
  fullTitle: computed('titleToken', 'parent.fullTitle', 'options.resetTitle', function () {
    var tokens = [], current = this, formatter, grabTokens = true, token;
    while (current && (!formatter || grabTokens)) {
      if (grabTokens) {
        token = current.get('titleToken');
        if (token) {
          if (!Ember.isArray(token)) {
            token = [token];
          }
          tokens.unshift.apply(tokens, token);
        }
        if (current.get('options.resetTitle')) {
          grabTokens = false;
        }
      }
      if (!formatter) {
        formatter = current.get('controller.documentTitleFormatter');
      }
      current = current.get('parent');
    }
    tokens = Ember.A(tokens).filter(Boolean);
    return (formatter || defaultFormatter)(tokens);
  }).readOnly(),

  /**
   * Humanized name of the route
   * @property humanizedName
   * @type {string}
   */
  humanizedName: computed('name', function () {
    return humanize(this.get('name'));
  }).readOnly(),


  /**
   * Our title builder
   * @property _titleBuilder
   * @type {Ember.ObjectProxy}
   */
  _titleBuilder: computed('isIndexRoute', 'humanizedName', 'routerTitleToken', function () {
    var tokenCP, defaultToken, props, originalTitleToken;
    // build the title computed property
    defaultToken = this.get('isIndexRoute') ? null : this.get('humanizedName');
    originalTitleToken = this.get('routerTitleToken');
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
      originalTitleToken.replace(/\{\{(.+)}}/g, function (dummy, path) {
        props.push(path);
      });
      tokenCP = computed.apply(Ember, props.concat([function () {
        var _this = this;
        return originalTitleToken.replace(/\{\{(.+)}}/g, function (dummy, path) {
          return _this.get(path);
        });
      }]));
    }
    // create our class and the computed properties for it, then create our object
    return Ember.ObjectProxy.extend({
      _defaultTitleToken: tokenCP,
      _realTitleToken:    computed('_defaultTitleToken', 'content.documentTitleToken', function () {
        var token = this.get('content.documentTitleToken');
        return token === false ? null : (token || this.get('_defaultTitleToken'));
      })
    }).create({
      content: this.controller
    });
  }).readOnly(),

  /**
   * Is our route the index route of parent resource?
   * @property isIndexRoute
   * @type {boolean}
   */
  isIndexRoute: computed.and('isRoute', 'isIndex'),

  /**
   * Are we the catch-all route?
   * @property isCatchAll
   * @type {boolean}
   */
  isCatchAll: computed.equal('cleanPath', '*wildcard'),

  /**
   * The index child of this resource if any
   * @property indexChild
   * @type {RouteMeta}
   */
  indexChild: computed('children.@each.isIndex', function () {
    return this.get('children').findBy('isIndex');
  }).readOnly(),

  /**
   * Kind of meta (resource or route)
   * @property kind
   * @type {string}
   */
  kind: computed('isResource', function () {
    return this.get('isResource') ? 'resource' : 'route';
  }).readOnly(),


  /**
   * The method doing the call as Router.map is expecting
   *
   * @method map
   * @param {Ember.Router.recognizer} target
   */
  map: function (target) {
    if (this.get('isResource') && !this.get('indexChild')) {
      // add index route if it does not exist
      this._route('index');
    }
    this.get('children').forEach(function (meta) {
      var args, kind, isResource;
      args = [meta.get('name'), {path: meta.get('path')}];
      kind = meta.get('kind');
      isResource = meta.get('isResource');
      if (isResource) {
        args.push(meta.get('mapFunction'));
      }
      console[meta.isResource && console.group ? 'group' : 'log'](
        '[enhanced-router] defining ' + kind + ' `' + args[0] + '` + with path `' + args[1] + '`'
      );
      target[kind].apply(target, args);
      if (isResource && console.group) {
        console.groupEnd();
      }
    });
  },

  /**
   * Get the function used to map with ember router
   * @property mapFunction
   * @type {Function}
   */
  mapFunction: computed(function () {
    var _this = this;
    return function () {
      _this.map(this);
    };
  }).readOnly(),

  /**
   * Full name of this route
   * @property fullName
   * @type {string}
   */
  fullName: computed('name', 'parent.fullName', function () {
    var parent = this.get('parent.fullName');
    if (parent && parent !== 'application') {
      return [parent, this.get('name')].join('.');
    }
    else {
      return this.get('name');
    }
  }).readOnly(),

  /**
   * Full path of the route
   * @property fullPath
   * @type {string}
   */
  fullPath: computed('path', 'parent.fullPath', function () {
    return '/' + Ember.A([this.get('parent.fullPath'), this.get('path')]).filter(Boolean).join('/');
  }).readOnly(),

  /**
   * The root route
   * @property root
   * @type {RouteMeta}
   */
  root: computed('parent.root', function () {
    return this.get('parent.root') || this;
  }).readOnly(),

  /**
   * Returns the direct child for given path
   *
   * @method childForPath
   * @param {string} path
   * @returns {RouteMeta}
   */
  childForPath: function (path) {
    return this.get('children').findBy('cleanPath', cleanPath(path));
  },

  /**
   * Returns the direct child for given name
   *
   * @method childForName
   * @param {string} name
   * @returns {RouteMeta}
   */
  childForName: function (name) {
    return this.get('children').findBy('name', name);
  },

  /**
   * Define a child-route to this route
   *
   * @method route
   * @param {string|RouteMeta} name
   * @param {string} [titleToken]
   * @param {{resetTitle: boolean}} [options]
   * @chainable
   */
  _route: function (name, titleToken, options) {
    var child;
    if (!this.get('isResource')) {
      this.set('isResource', true);
    }
    child = route(name, titleToken, options, this);
    child.set('parent', this);
    this.get('children').pushObject(child);
    return this;
  },

  /**
   * Define many child-routes to this route
   *
   * @method routes
   * @params {RouteMeta} [meta...]
   * @chainable
   */
  routes: function () {
    var routes = Array.prototype.slice.call(arguments);
    if (routes.length) {
      Ember.A(routes).forEach(function (child) {
        this._route(child);
      }, this);
    }
    else {
      if (!this.get('isResource')) {
        this.set('isResource', true);
      }
    }
    return this;
  },

  /**
   * Returns the string representation of this meta
   *
   * @returns {string}
   */
  toString: function () {
    return this.get('fullName') + '[' + this.get('fullPath') + ']';
  },

  /**
   * Transforms this RouteMeta into an Ember router
   *
   * @method toRouter
   * @param {Object} options
   * @return {Ember.Router}
   */
  toRouter: function (options) {
    var Router;
    options = options || {};
    if (this.get('parent')) {
      throw new Error('Only the root route may be exported as an Ember router.');
    }
    options._enhancedRouterRootMeta = this;
    Router = Ember.Router.extend(options);
    Router.map(this.get('mapFunction'));
    return Router;
  }
});

export default route;

