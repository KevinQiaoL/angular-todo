var todo = angular.module("todoApp", ["ui.router"]);
todo.config(function ($stateProvider, $urlRouterProvider, $httpProvider, $locationProvider) {
    $httpProvider.interceptors.push([
        '$injector',
        function ($injector) {
          return $injector.get('AuthInterceptor');
        }
    ]);
    $stateProvider
    .state('todos', {
        url: '/',
        templateUrl: 'templates/form.html',
        controller: 'mainCtrl'
    }).state('login', {
        url: '/login',
        templateUrl: 'templates/sign-in.html',
        controller: 'signInCtrl'
    }).state('reg', {
        url: '/reg',
        templateUrl: 'templates/sign-up.html',
        controller: 'signUpCtrl'
    });
    $urlRouterProvider.otherwise('/');
    $locationProvider.html5Mode(true);
});
//run
todo.run(function ($rootScope, AUTH_EVENTS, AuthService, $state, $window) {
  $rootScope.$on('$stateChangeStart', function (event, userInfo) {
    if($window.sessionStorage["userInfo"]) {
        userInfo = $window.sessionStorage["userInfo"];
        $rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
        $rootScope.$broadcast(userInfo);
        $rootScope.isLogin = false;
        $rootScope.isLogout = true;
    } else {
        $rootScope.$broadcast(AUTH_EVENTS.notAuthenticated);
        $rootScope.isLogin = true;
        $rootScope.isLogout = false;
        //$state.reload('login');
    }
  });
  $rootScope.logout = function(){
      AuthService.logout().then(function(){
          $rootScope.$broadcast(AUTH_EVENTS.logoutSuccess);
          $state.reload('todos');
      });
  }
});
//controller
todo.controller('mainCtrl',function($scope, $state, $http, $window){ // todo页面
	$scope.title = 'Todo';
  var userInfo;
  if($window.sessionStorage["userInfo"]) {
    userInfo = JSON.parse($window.sessionStorage["userInfo"]);
  }
  //获取 todo 数据
  $scope.initTodo = function(){
    $http.post('/lists')
      .success(function(res) {
        if(res.status == 0){
          $state.go('login');
        }else if(res.status == 1){
          $scope.lists = res.post;
        }
          /*$scope.lists = res;*/
          
      });
  }
  $scope.initTodo();
  
  //增加 todo 数据
  $scope.createTodo = function() {
    console.log(userInfo.userName);
    if($scope.formData == undefined){
      alert("不能为空");
    }else{
      $http.post('/create', {name:userInfo.userName, post:$scope.formData})
      .success(function(res) {
          $scope.formData = "";
          if(res.status == 2){
            $scope.initTodo();
          }
      });
    }
  }
  //删除 todo 数据
  $scope.deleteTodo = function(id) {
    //console.log(id);
    $http.post('/delete/'+ id)
    .success(function(res) {
        console.log(res);
        if(res.status == 2){
          $scope.initTodo();
        }
    });
  }
})
.controller('signInCtrl',function($scope, $rootScope, AuthService, AUTH_EVENTS, $state, $window){ // 登录页面
	$scope.title = '登录';
	var login = $scope.login = {
        show_error: true,
        user: {}
    }
    login.submit = function (basic_form) {
        login.show_error = true;
        basic_form.$setDirty();
        if(basic_form.$valid) {
            AuthService.login(login.user).then(function (user) {
              $rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
              $state.go('todos');
            }, function () {
              $rootScope.$broadcast(AUTH_EVENTS.loginFailed);
            });
        }
    };
})
.controller('signUpCtrl',function($scope, $rootScope, AuthService, AUTH_EVENTS, $state){ // 注册页面
	$scope.title = '注册';
    var reg = $scope.reg = {
        show_error: true,
        user: {}
    };

    reg.submit = function (basic_form) {
        reg.show_error = true;
        basic_form.$setDirty();
        if (basic_form.$valid) {
            AuthService.register(reg.user).then(function (user) {
              $rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
              $state.go('todos');
            }, function () {
              $rootScope.$broadcast(AUTH_EVENTS.loginFailed);
            });
        }
    };
});
//directive 
todo.directive("repeat", [function () {
    return {
        restrict: 'A',
        require: "ngModel",
        link: function (scope, element, attrs, ctrl) {
            if (ctrl) {
                var otherInput = element.inheritedData("$formController")[attrs.repeat];

                var repeatValidator = function (value) {
                    var validity = value === otherInput.$viewValue;
                    ctrl.$setValidity("repeat", validity);
                    return validity ? value : undefined;
                };

                ctrl.$parsers.push(repeatValidator);
                ctrl.$formatters.push(repeatValidator);

                otherInput.$parsers.push(function (value) {
                    ctrl.$setValidity("repeat", value === ctrl.$viewValue);
                    return value;
                });
            }
        }
    };
}])
.directive('loginDialog', function (AUTH_EVENTS) {
  return {
    restrict:'A',
    templateUrl: 'templates/sign-in.html',
    link: function (scope) {
      var showDialog = function () {
        scope.visible = true;
      };

      scope.visible = false;
      scope.$on(AUTH_EVENTS.notAuthenticated, showDialog);
      scope.$on(AUTH_EVENTS.sessionTimeout, showDialog)
    }
  };
})
;

/*
  .directive ==> restrict
  E - 元素名称： <my-directive></my-directive>
  A - 属性名： <div my-directive=”exp”></div>
  C - class名： <div class=”my-directive:exp;”></div>
  M - 注释 ： <!-- directive: my-directive exp -->

*/

//constant
todo.constant('AUTH_EVENTS', {
  loginSuccess: 'auth-login-success',
  loginFailed: 'auth-login-failed',
  logoutSuccess: 'auth-logout-success',
  sessionTimeout: 'auth-session-timeout',
  notAuthenticated: 'auth-not-authenticated'
})
.constant('User_Status', {isLogined: false});

//factory
todo.factory('AuthService',function($http, $window){
    var authService = {},
        userInfo;
    authService.login = function (request) {
        return $http
        .post("/login", request)
        .then(function(res) {
          userInfo = {
            accessToken: res.data.user.password,
            userName: res.data.user.name
          };
          $window.sessionStorage["userInfo"] = JSON.stringify(userInfo);
          return userInfo;
        });
    }
    authService.register = function (request) {
        return $http
        .post("/reg", request)
        .then(function(res) {
          userInfo = {
            accessToken: res.data.user.password,
            userName: res.data.user.name
          };
          $window.sessionStorage["userInfo"] = JSON.stringify(userInfo);
          return userInfo;
        });
    }
    authService.logout = function () {
        return $http
        .post("/logout")
        .then(function(res) {
          userInfo = null;
          $window.sessionStorage.clear();
          return userInfo;
        });
    }
    return authService;
})
.factory('AuthInterceptor', function ($rootScope, $q, AUTH_EVENTS) {
  return {
    responseError: function (response) { 
      $rootScope.$broadcast({
        401: AUTH_EVENTS.notAuthenticated,
        403: AUTH_EVENTS.notAuthenticated,
        419: AUTH_EVENTS.sessionTimeout,
        440: AUTH_EVENTS.sessionTimeout
      }[response.status], response);
      return $q.reject(response);
    }
  };
});
//service

