import config from './config/environment';
import route from 'ember-enhanced-router/route';

// if any controller.documentTitleToken exists, then it'll be used as the titleToken if no
// title has been defined in the router
export default route(null, 'Ember Enhanced Router') // application route with title `Ember Enhanced Router`
  .routes( // define sub-routes
  route('home@/', false), // `home` route with no title token and `/` as path
  route('dashboard'), // `dashboard` route with title token `Dashboard` and `dashboard` as path
  route('members@users', 'All Members') // `members` route with title token `All Members` and `users` as path
    .routes( // define sub-routes
    route('index'), // `index` route with no title token and `/` as path (because `index`)
    route('show@:user_id', 'User {{name}}'), // `show` route with `User <controller.name>` title token and `:user_id` as path
    route('new', 'New User', {resetTitle: true}), // `new` route with `New User` title and `new` as path (true stop bubbling for tokens)
    route('edit@:user_id/edit', function (controller) {
      if (controller.get('model') === controller.get('session.user')) {
        return 'Edit Profile';
      }
      else {
        return 'Edit User {{name}}';
      }
    }) // `edit` route with either `Edit profile` or `Edit User <controller.name>` title token and `:user_id/edit` as path
  ),
  route('catchall@*')
).toRouter({location: config.locationType});
