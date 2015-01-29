import Ember from 'ember';

var keyPrefix = '$$EER$$';

function registerMeta(dict, meta) {
  var name = meta.get('fullName');
  dict[keyPrefix + name] = meta;
  meta.get('children').forEach(function (subMeta) {
    registerMeta(dict, subMeta);
  });
}

/**
 * @class EnhancedRouterService
 * @extends Ember.Object
 */
export default Ember.Object.extend({
  /**
   * Collection of all route meta
   * @property routes
   * @type {Object}
   */
  metaIndex: Ember.computed(function () {
    var dict = Object.create(null);
    var meta = this.container.lookup('router:main').get('_enhancedRouterRootMeta');
    registerMeta(dict, meta);
    return dict;
  }).readOnly(),

  /**
   * Get the route meta for given route name
   *
   * @method metaForRoute
   * @param {string} name
   * @return {RouteMeta}
   */
  metaForRoute: function (name) {
    return this.get('metaIndex')[keyPrefix + name];
  },

  /**
   * The currently active route's meta
   * @property activeMeta
   * @type {Array}
   */
  activeMeta: null,

  /**
   * The current title
   * @property currentTitle
   * @type {string}
   */
  currentTitle: Ember.computed.readOnly('activeMeta.fullTitle')

});
