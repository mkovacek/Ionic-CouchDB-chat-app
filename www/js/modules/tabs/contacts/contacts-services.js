angular.module('contacts.services', []).factory('ContactsServices', ContactsServices);

ContactsServices.$inject = ['$q','CouchDBServices','UserSessionServices'];

/**
 * @name ContactsServices
 * @desc Singleton service class with static methods for actions with user contacts.
 * @param $q - service that helps you run functions asynchronously, and use their return values
 *              when they are done processing
 * @param CouchDBServices - service for actions with CouchDB
 * @param UserSessionServices - service for checking user data and session
 */
function ContactsServices($q,CouchDBServices,UserSessionServices) {

    return {
        getSimContacts:getSimContacts,
        checkAndUpdateContacts:checkAndUpdateContacts
    };

    /**
     * @name getSimContacts
     * @desc  function use cordova sim plugin and fetch contacts from users phone
     * @returns array of users contacts
     */
    function getSimContacts(){
        console.log("ContactsServices.getSimContacts()");
        var q = $q.defer();
        var phoneContacts=[];

        function onSuccess(contacts) {
            angular.forEach(contacts,function(contact){
                if(contact.phoneNumbers!=null) {
                    console.log("phone numbers exists");
                    var type = phoneUtils.getNumberType(contact.phoneNumbers[0].value,'HR');
                    if(type==='MOBILE'){
                        console.log("only mobile phone numbers");
                        var phone=phoneUtils.formatE164(contact.phoneNumbers[0].value, 'HR');
                        if (phoneContacts.indexOf(phone) == -1) {
                            phoneContacts.push(phone);
                        }
                    }
                }
            });
            q.resolve(phoneContacts);
        }

        function onError(contactError) {
            console.log('onError!');
        }

        var options = new ContactFindOptions();
        options.filter = "";
        options.multiple=true;
        options.hasPhoneNumber=true;
        var fields = ["displayName","phoneNumbers"];
        navigator.contacts.find(fields, onSuccess, onError, options);
        return q.promise;
    }

    /**
     * @name checkAndUpdateContacts
     * @desc  function fetch contacts from phone, search if someone from contacts is new app user and if there are new
     * users update's user document with new contacts
     * @returns user contacts or error message
     */
    function checkAndUpdateContacts(){
        console.log("ContactsServices.checkAndUpdateContacts()");
        var q = $q.defer();
        this.getSimContacts().then(function(simContacts){
            console.log("fetched sim contacts");
            CouchDBServices.getDocuments(simContacts).then(function(appUsers){
                if(appUsers.rows.length!=0){
                    var contacts=[];
                    angular.forEach(appUsers.rows,function(user){
                        if('doc' in user){
                            if(user.doc!=null){
                                console.log("fetched contacts info that are app users");
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
                    var userData=UserSessionServices.getUser();
                    if(JSON.stringify(userData.contacts)!=JSON.stringify(contacts)){
                        console.log("local contacts != remote app users that are sim contacts");
                        userData.contacts=contacts;
                        var user=userData;
                        var userId=userData._id;
                        delete userData['_id'];
                        CouchDBServices.updateDocument(userId,userData).then(function(success){
                            console.log("updated remote contacts, saving to local storage");
                            UserSessionServices.setUser(user);
                            q.resolve(userData.contacts);
                            console.log(success);
                        },function(err){
                            console.log("error when updating document");
                            q.reject(err);
                        });
                    }else{
                        q.reject("up to date");
                    }
                }else{
                    q.reject("there is no contacts");
                }
            },function(err){
                q.reject(err);
            });
        },function(err){
            q.reject(err);
        });
        return q.promise;
    }
}

