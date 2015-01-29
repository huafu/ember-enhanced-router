# ember-enhanced-router

This addon make it easier and more readable to define your application's router and let you have
dynamically updated document title depending on given title tokens in the router or the agglomerated
`documentTitleToken` properties of each controller in the hierarchy of the current route.

The idea came first after using [ember-cli-document-title](https://github.com/kimroen/ember-cli-document-title)
and finding it too complex to define the titles and not dynamic. I thought that the title tokens for
each route should be defined in the router instead of inside each route, and I also that using the
model as unique variable to create the title token of a route was not enough.

See the demo application [there](http://huafu.github.io/ember-enhanced-router/).


## Installation

* `npm install --save-dev ember-enhanced-router`
* or, with the latest `ember-cli`: `ember install:addon ember-enhanced-router`


## Usage

* First you need to define your router using the new helper provided, `route`. It basically defines
a new route. It takes 1, 2 or 3 arguments:

    1. `name` and options `path`: The name of the route + `@` + the path of the route. If there is no
    `@`, the default path is the name of that route, or `/` if the name of the route is `index`.
    
    2. `titleToken`: By default the title token is the humanized version of the route name, or
    nothing if the route is the index route (path is `/` and it has no sub-routes. It can be:
    
        - a `string` with optionals controller property names defined between `{{` and `}}` to be
        replaced with the route's corresponding controller properties.
        - a `function` which will be defined as a volatile computed property within the context of
        the controller (`this` in the function will be a proxy to the controller).
        - a `computed property` which will be defined on the context of the controller too (`this`
        will be a proxy to the controller and the dependant key will be relative to that controller)
        - `false` to not included any title token for that route
        - `null` will act as if you didn't give any title token (see this `2.` header)
        
    3. `options`: By default no options are given. For now there are 2 supported options:
    
        - `resetTitle`: If set to `true`, the system will use all the title tokens until this route,
        not the ones of the parent(s)
        - `asResource`: If set to `true`, the route will be defined in ember router using
        `this.resource` instead of `this.route`.
        
* Once you're done defining your routes, call `.toRouter()` to generate and export the router
expected by Ember. It'll use the first parameter to extend Ember.Router and create the Router, so
it's a good place to define for example the location type.

* To update the `document.title` automatically taking care of the bindings and all, you need to insert the
`document-title` component in your `application` template: `{{document-title}}`. By default, it'll
not show anything, but you can set the `display` attribute in the hash to `true` or `inline` or any
css `display` attribute value.

* By default all title tokens will be collected in the current route's hierarchy and then joined from
the top most route to the application one. You can change this behavior by defining in the controller
of any route a `documentTitleFormatter` property being a function. From the top-most to the bottom-most
active route, the `documentTitleFormatter` property of the first associated controller will be the
one used to put together all the collected tokens.

    It'll receive 2 arguments of type array. The first one will be all the collected non-empty tokens
    from the application route to the top-most currently activate route. The second one is the same
    but in reverse order. It could differ from `.reverse()` when the title token of a route is an array
    instead of a string. This array itself is not reversed, but concatenated to the rest of the tokens.

## Example

There is nothing better than an example so here it is:

    ```js
    import Ember from 'ember';
    import config from './config/environment';
    import route from 'ember-enhanced-router/route';
    
    // if any controller.documentTitleToken exists, then it'll be used as the titleToken, except if
    // the title has ben set to `false` in the router
    
    // application route with title `Ember Enhanced Router` (null could be replaced with 'application')
    export default route(null, 'Ember Enhanced Router').routes( // this defines the sub-routes
      // `home` route with no title token and `/` as path
      route('home@/', false),
    
      // `dashboard` route with title token `Dashboard` and `dashboard` as path
      route('dashboard'),
    
      // `members` route with title token `All Members` and `users` as path
      route('members@users', 'All Members').routes(
        // `index` route with no title token and `/` as path (because `index`)
        // this line is optional as the system will automatically add it if it does not find any
        // route with `/` as path.
        // But if you need to define a title to this route, you can do it here.
        route('index'),
    
        // `show` route with `User <controller.name>` title token and `:user_id` as path
        route('show@:user_id', 'User {{name}}'),
    
        // `new` route with `New User` title and `new` as path (the title will just be 'New User'
        // since we defined the `resetTitle` option to `true`
        route('new', 'New User', {resetTitle: true}),
    
        // `edit` route with either `Edit profile` or `Edit User <controller.name>` title token and `:user_id/edit` as path
        // the computed property has the controller as context
        route('edit@:user_id/edit', function () {
          if (this.get('model') === this.get('session.user')) {
            return 'Edit Profile';
          }
          else {
            return 'Edit User ' + this.get('name');
          }
        }.property('model', 'name', 'session.user'))
      ),
    
      // the catchall route if necessary, with `Nothing Here` as the title
      route('catchall@*', 'Nothing Here!')
    ).toRouter({location: config.locationType});
    ```


## Author

![Huafu Gandon](https://s.gravatar.com/avatar/950590a0d4bc96f4a239cac955112eeb?s=24)
Huafu Gandon - Follow me on twitter: [huafu_g](https://twitter.com/huafu_g)

---

For more information on using ember-cli, visit [http://www.ember-cli.com/](http://www.ember-cli.com/).
