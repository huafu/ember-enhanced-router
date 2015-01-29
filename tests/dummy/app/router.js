import Ember from 'ember';
import config from './config/environment';
import route from 'ember-enhanced-router/route';

// if any controller.documentTitleToken exists, then it'll be used as the titleToken if no
// title has been defined in the router

// application route with title `Ember Enhanced Router`
export default route(null, 'Ember Enhanced Router').routes(
  // `home` route with no title token and `/` as path
  route('home@/', false),

  // `dashboard` route with title token `Dashboard` and `dashboard` as path
  route('dashboard'),

  // `members` route with title token `All Members` and `users` as path
  route('members@users', 'All Members').routes(
    // `index` route with no title token and `/` as path (because `index`)
    route('index'),

    // `show` route with `User <controller.name>` title token and `:user_id` as path
    route('show@:user_id', 'User {{name}}'),

    // `new` route with `New User` title and `new` as path (true stop bubbling for tokens)
    route('new', 'New User', {resetTitle: true}),

    // `edit` route with either `Edit Profile` or `"<controller.model.name>"` title token and `:user_id/edit` as path
    // the computed property has the controller as context
    route('edit@:user_id/edit', function () {
      if (this.get('isSessionUser')) {
        return 'Edit Profile';
      }
      else {
        return '"' + this.get('name') + '"';
      }
    }.property('isSessionUser', 'model.name'))
  ),

  // the catchall route
  route('catchall@*')
).toRouter({location: config.locationType});
