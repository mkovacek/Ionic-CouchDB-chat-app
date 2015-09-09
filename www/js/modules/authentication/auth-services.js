angular.module('auth.services', []).factory('AuthServices', AuthServices);

AuthServices.$inject = ['UserSessionServices','CouchDBServices','$ionicPopup','ContactsServices','$state','$ionicHistory'];

/**
 * @name AuthServices
 * @desc Singleton service class with static methods for user registration and login.
 * @param UserSessionServices - service for checking user data and session
 * @param CouchDBServices - service for actions with CouchDB
 * @param $ionicPopup - Ionic Popup service for creating and showing popup windows
 * @param ContactsServices - service for actions with user contacts.
 * @param $state - service for representing states as well as transitioning between the them
 * @param $ionicHistory - service that keeps track of views as the user navigates through an app
 */
function AuthServices(UserSessionServices,CouchDBServices,$ionicPopup,ContactsServices,$state,$ionicHistory) {

    return {
        register:register,
        login:login
    };

    /**
     * @name register
     * @desc  function for user registration.
     * @param userData - data about user
     */
    function register(userData){
        console.log("AuthService.register()");
        CouchDBServices.checkUser(userData.phone).then(function(res){
            if(res.rows.length==0){
                console.log("user doesn't exists");
                var contacts=[];
                ContactsServices.getSimContacts().then(function(simContacts){
                    console.log("fetched sim contacts");
                    CouchDBServices.getDocuments(simContacts).then(function(appUsers){
                        console.log("fetched app users");
                        if(appUsers.rows.length!=0){
                            angular.forEach(appUsers.rows,function(user){
                                if('doc' in user){
                                    if(user.doc!=null){
                                        contacts.push(
                                            {
                                                'firstName'  : user.doc.firstName,
                                                'lastName'   : user.doc.lastName,
                                                'phone'      : user.doc.phone
                                            }
                                        );
                                    }
                                }
                            });

                            var docData={
                                _id         : userData.phone,
                                type        : 'user',
                                firstName   : userData.firstName,
                                lastName    : userData.lastName,
                                phone       : userData.phone,
                                password    : userData.password,
                                contacts    : contacts
                            };

                            CouchDBServices.createDocument(docData)
                                .then(function(success){
                                    console.log("document is created => user registered");
                                    UserSessionServices.setUser(docData);
                                    $ionicHistory.nextViewOptions({
                                        disableAnimate: true,
                                        disableBack: true
                                    });
                                    $state.go("tab.chats", {}, {location: "replace", reload: true});
                                },function(err){
                                    console.log("document is not created => user isn't registered: "+err);
                                });
                        }
                        },function(err){
                            console.log("app users aren't fethed: "+err);
                        });
                },function(err){
                    console.log("sim contacts aren't fetched: "+err);
                });
            }else{
                console.log("User is already registered");
                $ionicPopup.alert({
                    title:"Warning",
                    content:"User is already registered."
                })
            }
        },function(err){
            console.log("error when checking user: "+err);
            $ionicPopup.alert({
                title:"Ups",
                content:"Something has gone wrong,try again."
            })
        });
    }

    /**
     * @name login
     * @desc  function for user authentication.
     * @param userData - user phone number and password
     */
    function login(userData){
        console.log("AuthService.login()");
        CouchDBServices.auth(userData).then(function(success){
            if(success.rows.length==1 && success.rows[0].value.auth){
                console.log("user successfully logined");
                UserSessionServices.setUser(success.rows[0].doc);
                $ionicHistory.nextViewOptions({
                    disableAnimate: true,
                    disableBack: true
                });
                $state.go("tab.chats", {}, {location: "replace", reload: true});
            }else{
                console.log("user isn't logined");
                $ionicPopup.alert({
                    title:"Warning",
                    content:"Phone number or password are incorrect."
                })
            }
        },function(err){
            console.log("login error: "+err);
            $ionicPopup.alert({
                title:"Ups",
                content:"Something has gone wrong,try again."
            })
        });
    }
}

