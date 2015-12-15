'use strict';

(function() {

function UserResource($resource) {
  return $resource('/api/users/:id/:controller', {
    id: '@_id'
  },
  {
    changePassword: {
      method: 'PUT',
      params: {
        controller:'password'
      }
    },
    get: {
      method: 'GET',
      params: {
        id:'me'
      }
    },
    changeType: {
      method: 'PUT',
      params: {
        controller:'update'
      }
    }
  });
}

angular.module('hrr10MjbeApp.auth')
  .factory('User', UserResource);

})();
