'use strict';

module.exports = function(User) {
  delete User.validations.email;
};
