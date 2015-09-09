(function() {

    angular.module('auth.controller', []).controller('AuthCtrl', AuthCtrl);

    AuthCtrl.$inject = ['UserSessionServices','$ionicPopup','AuthServices','$state','$ionicHistory'];

    /**
     * @name AuthCtrl
     * @desc Controller for authentication screen, login and registration
     * @param UserSessionServices - service for checking user data and session
     * @param $ionicPopup - Ionic Popup service for creating and showing popup windows
     * @param AuthServices - service for actions with user registration and login
     * @param $state - service for representing states as well as transitioning between the them
     * @param $ionicHistory - service that keeps track of views as the user navigates through an app
     */
    function AuthCtrl(UserSessionServices,$ionicPopup,AuthServices,$state,$ionicHistory) {
        console.log("AuthCtrl");
        if(UserSessionServices.isLoggedIn()){
            console.log("user is loggedIn, clear views history and redirect to tab.chats state");
            $ionicHistory.nextViewOptions({
                disableAnimate: true,
                disableBack: true
            });
            $state.go("tab.chats", {}, {location: "replace", reload: true});
        }

        this._$ionicPopup=$ionicPopup;
        this._AuthServices=AuthServices;

        this.loginData={
            phone:'',
            password:''
        };
        this.regData={
            firstName:'',
            lastName:'',
            phone:'',
            password:''
        };

        this.repeatedPassword=null;
        this.show = false;
    }

    /**
     * @name signIn
     * @desc  function for user authentication.
     * @param valid - true/false, if form is correctly filled
     */
    AuthCtrl.prototype.signIn=function(valid){
        console.log("AuthCtrl.signIn()");
        if(valid){
            console.log("form is valid");
            var phone=angular.element("#loginPhone").intlTelInput("getNumber");
            this.loginData.phone=phone;
            this._AuthServices.login(this.loginData);
        }
    };
    /**
     * @name signUp
     * @desc  function for user registration.
     * @param valid - true/false, if form is correctly filled
     */
    AuthCtrl.prototype.signUp=function(valid){
        console.log("AuthCtrl.signUp()");
        if(valid){
            console.log("form is valid");
            var isValid =angular.element("#regPhone").intlTelInput("isValidNumber");
            if(isValid){
                console.log("phone number is valid");
                var isMobile=angular.element("#regPhone").intlTelInput("getNumberType");
                if (isMobile != intlTelInputUtils.numberType.MOBILE) {
                    console.log("phone number isn't mobile");
                    this._$ionicPopup.alert({
                        title:"Warning",
                        content:"Only mobile phone number."
                    });
                }else{
                    console.log("phone number is mobile");
                    var phone=angular.element("#regPhone").intlTelInput("getNumber");
                    this.regData.phone=phone;
                    this._AuthServices.register(this.regData);
                }
            }else{
                console.log("phone number isn't valid");
                this._$ionicPopup.alert({
                    title:"Warning",
                    content:"Please enter valid mobile phone number."
                })
            }
        }
    };

    //switching login and registration forms

    /**
     * @name on
     * @desc  function set true value for showing form.
     */
    AuthCtrl.prototype.on = function() {
        console.log("AuthCtrl.on()");
        this.show = true;
    };

    /**
     * @name off
     * @desc  function set false value for not showing form.
     */
    AuthCtrl.prototype.off = function() {
        console.log("AuthCtrl.off()");
        this.show = false;
    };

    /**
     * @name showForm
     * @desc  function return value for showing or not form.
     * @returns true/false
     */
    AuthCtrl.prototype.showForm = function() {
        console.log("AuthCtrl.showForm()");
        return this.show;
    };
})();
