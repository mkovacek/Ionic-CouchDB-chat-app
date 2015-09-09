(function() {
    angular.module('contacts.controller', []).controller('ContactsCtrl', ContactsCtrl);

    ContactsCtrl.$inject = ['UserSessionServices','ContactsServices'];

    /**
     * @name ContactsCtrl
     * @desc Controller for contacts list screen
     * @param UserSessionServices - service for checking user data and session
     * @param ContactsServices - service for actions with user contacts
     */
    function ContactsCtrl(UserSessionServices,ContactsServices) {
        console.log("ContactsCtrl");
        var that=this;
        this.converastionId='';

        this.userData=UserSessionServices.getUser();
        this.contacts=this.userData.contacts;

        ContactsServices.checkAndUpdateContacts()
            .then(function(contacts){
                console.log("updated contacts list");
                that.contacts=contacts;
            },function(err){
                console.log(err);
            }
        );
    }

    /**
     * @name conversationId
     * @desc  function return conversation id
     */
    ContactsCtrl.prototype.conversationId=function(contactId){
        return this.converastionId=parseInt(this.userData._id.substring(1))< parseInt(contactId.substring(1)) ? this.userData._id+';'+contactId : contactId+';'+this.userData._id;
    }

})();
