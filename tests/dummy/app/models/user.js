import DS from 'ember-data';

var User = DS.Model.extend({
  name: DS.attr('string')
});

User.reopenClass({
  FIXTURES: [
    {
      id:   1,
      name: 'Huafu Gandon'
    }
  ]
});

export default User;
