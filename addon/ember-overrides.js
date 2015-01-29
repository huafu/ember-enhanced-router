import Ember from 'ember';

/**
 * @class EnhancedRouterRouteOverrides
 * @extension EnhancedRouterRouteOverrides
 * @extends Ember.Route
 * @property {EnhancedRouterService} enhancedRouterService
 */
Ember.Route.reopen({
  /**
   * The meta for this route
   * @property enhancedRouterMeta
   * @type {RouteMeta}
   */
  enhancedRouterMeta: Ember.computed(function () {
    var meta = this.enhancedRouterService.metaForRoute(this.routeName);
    meta.registerRoute(this);
    return meta;
  }).readOnly(),

  _actions: {
    /**
     * Registers the route as active/inactive
     *
     * @method enhancedRouterActivateRoute
     */
    enhancedRouterActivateRoute: function () {
      this.enhancedRouterService.set('activeMeta', this.get('enhancedRouterMeta'));
    }
  }
});

Ember.Router.reopen({
  enhancedRouterDidTransition: Ember.on('didTransition', function () {
    this.send('enhancedRouterActivateRoute');
  })
});
