import Ember from 'ember';

/**
 * @class DocumentTitleComponent
 * @extends Ember.Component
 *
 * @property {EnhancedRouterService} enhancedRouter
 */
export default Ember.Component.extend({
  /**
   * @inheritDoc
   */
  attributeBindings: ['style'],

  /**
   * @inheritDoc
   */
  tagName: 'div',

  /**
   * The style of our component
   * @property style
   * @type {string}
   */
  style: Ember.computed('display', function () {
    var display = this.get('display');
    if (display === false) {
      display = 'none';
    }
    else if (display === true) {
      display = null;
    }
    return display ? ('display:' + display + ';') : '';
  }).readOnly(),


  /**
   * Whether to show or not our div
   * @property display
   * @type {string|boolean}
   */
  display: false,


  /**
   * The document title
   * @property documentTitle
   * @type {string}
   */
  documentTitle: Ember.computed.readOnly('enhancedRouter.currentTitle')

});
