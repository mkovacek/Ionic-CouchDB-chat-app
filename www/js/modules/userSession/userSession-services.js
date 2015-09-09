angular.module('userSession.services', []).factory('UserSessionServices', UserSessionServices);

/**
 * @name UserSessionServices
 * @desc Singleton service class with static methods for checking user data and session
 */
function UserSessionServices() {

    return {
        setUser:setUser,
        getUser:getUser,
        isLoggedIn:isLoggedIn
    };

    /**
     * @name setUser
     * @desc  function saves user data into local storage
     * @param userData - data about user (equal to user document in couchdb database)
     */
    function setUser(userData){
        console.log("UserSessionServices.setUser()");
        window.localStorage['user'] = JSON.stringify(userData);
    }

    /**
     * @name getUser
     * @desc  function fetch user data from local storage
     * @returns object with user data
     */
    function getUser(){
        console.log("UserSessionServices.getUser()");
        return JSON.parse(window.localStorage.getItem('user'));
    }

    /**
     * @name isLoggedIn
     * @desc  function fetch user data from local storage
     * @returns true or false (if exists user data)
     */
    function isLoggedIn(){
        console.log("UserSessionServices.isLoggedIn()");
        return Boolean(JSON.parse(window.localStorage.getItem('user')));
    }

}

