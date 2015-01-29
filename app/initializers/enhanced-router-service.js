export function initialize(container, application) {
  application.inject('route', 'enhancedRouterService', 'service:enhanced-router');
  application.inject('controller', 'enhancedRouterService', 'service:enhanced-router');
  application.inject('component:document-title', 'enhancedRouter', 'service:enhanced-router');
}

export default {
  name:       'enhanced-router-service',
  initialize: initialize
};
