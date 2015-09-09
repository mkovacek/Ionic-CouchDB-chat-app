// Ionic CouchChat App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'couchChat' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'registration.services' is found in js/module/registration... etc
angular.module('couchChat',
    [ 'ionic',
      'ngResource',
      'pouchdb',
      'internationalPhoneNumber',
      'ngLetterAvatar',
      'angularMoment',
      'monospaced.elastic',
      'angular-underscore',
      'couchDB.services',
      'userSession.services',
      'auth.services',
      'auth.controller',
      'contacts.services',
      'contacts.controller',
      'chat.services',
      'chat.controller',
      'chatDetails.controller'
    ]
)

.run(function($ionicPlatform,$ionicPopup) {
  $ionicPlatform.ready(function() {

    //checking internet connection, if doesn't exists, turning off app
    if(window.Connection) {
      if(navigator.connection.type == Connection.NONE) {
        $ionicPopup.alert({
          title:"Warning",
          content:"Application require internet connection, please turn on your internet connection."
        }).then(function(res){
            if(res)
            navigator.app.exitApp();
        });
      }
    }

    // Hide the accessory bar by default
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);
    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleLightContent();
    }

    //setting default values for local notification
    if(window.cordova && window.cordova.plugins.notification){
      // Ask for permission to display notifications.
      //cordova.plugins.notification.local.registerPermission();
      cordova.plugins.notification.local.setDefaults({
        autoCancel: true,
        badge: 1
      });
    }
    //hides splashscreen
    setTimeout(function() {
      navigator.splashscreen.hide();
    }, 0);

  });
})

.constant('SERVER_ADDRESS', 'http://localhost:5984/chat')

.config(function($stateProvider, $urlRouterProvider) {

  // if none of the states are matched, use this as the fallback
  $urlRouterProvider.otherwise('auth');

  $stateProvider

  .state('auth', {
    url: '/auth',
    views:{
      "" : {
        templateUrl: 'js/modules/authentication/auth.html',
        controller   : 'AuthCtrl as ac'
      },
      "login@auth" : {
        templateUrl  : 'js/modules/authentication/login.html'
      },

      "registration@auth" : {
        templateUrl  : 'js/modules/authentication/registration.html'
      }
    }
  })

  // setup an abstract state for the tabs directive
  .state('tab', {
      url: '/tab',
      abstract: true,
      templateUrl: 'js/modules/tabs/tabs.html'
  })

  // Each tab has its own nav history stack:
  .state('tab.contacts', {
    url: '/contacts',
    views: {
      'tab-contacts': {
        templateUrl: 'js/modules/tabs/contacts/tab-contacts.html',
        controller: 'ContactsCtrl as conCtrl'
      }
    }
  })

  .state('tab.chats', {
      url: '/chats',
      views: {
        'tab-chats': {
          templateUrl: 'js/modules/tabs/chat/tab-chats.html',
          controller: 'ChatCtrl as cCtrl'
        }
      }
    })
  .state('tab.chat-detail', {
      url: '/chats/:chatId',
      views: {
        'tab-chats': {
          templateUrl: 'js/modules/tabs/chat/chat-detail.html',
          controller: 'ChatDetailsCtrl as detCtrl'
        }
      }
    })

    .state('tab.contacts-chat', {
      url: '/contacts/chats/:chatId',
      views: {
        'tab-contacts': {
          templateUrl: 'js/modules/tabs/chat/chat-detail.html',
          controller: 'ChatDetailsCtrl as detCtrl'
        }
      }
    })
});
