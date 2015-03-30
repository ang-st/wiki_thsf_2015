var DB = require('./db').DB;
var User = DB.Model.extend({
   tableName: 'Users',
   idAttribute: 'userId',
});

module.exports = {
   User: User
};


