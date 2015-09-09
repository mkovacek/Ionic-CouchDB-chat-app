angular.module('chat.services', []).factory('ChatServices', ChatServices);

ChatServices.$inject = ['$q','CouchDBServices','UserSessionServices'];

/**
 * @name ChatServices
 * @desc Singleton service class with static methods for actions with user conversations.
 * @param $q - service that helps you run functions asynchronously, and use their return values
 *              when they are done processing
 * @param CouchDBServices - service for actions with CouchDB
 * @param UserSessionServices - service for checking user data and session
 */
function ChatServices($q,CouchDBServices,UserSessionServices) {

    return {
        getConversations:getConversations,
        getConversation:getConversation,
        getConversationsLocal:getConversationsLocal,
        setConversationsLocal:setConversationsLocal,
        getConversationLocal:getConversationLocal,
        setConversationLocal:setConversationLocal,
        getParticipantsInfo:getParticipantsInfo,
        sendMessage:sendMessage,
        getChatIds:getChatIds
    };

    /**
     * @name getChatIds
     * @desc  function creates possible conversation documents id's
     * @param contacts - array of contacts phone numbers
     * @param myId - users phone number
     * @returns array of conversation id's
     */
    function getChatIds(contacts,myId){
        console.log("ChatServices.getChatIds()");
        var q = $q.defer();
        var chatIds=[];
        angular.forEach(contacts,function(contact){
            var chatId= parseInt(myId.substring(1))<parseInt(contact.phone.substring(1)) ? myId+";"+contact.phone : contact.phone+";"+myId;
            chatIds.push(chatId);
        });
        q.resolve(chatIds);
        return q.promise;
    }

    /**
     * @name getConversations
     * @desc  function fetches all user conversation documents and save to local storage
     * @returns array of conversations
     */
    function getConversations(){
        console.log("ChatServices.getConversations()");
        var that=this;
        var q = $q.defer();
        var userData=UserSessionServices.getUser();
        this.getChatIds(userData.contacts,userData._id).then(function(chatIds){
            console.log("fetched chat ids");
            CouchDBServices.getDocuments(chatIds).then(function(conversations){
                if(conversations.rows.length!=0){
                    console.log("fetched documents");
                    var chats=[];
                    angular.forEach(conversations.rows,function(conversation){
                        if('doc' in conversation){
                            if(conversation.doc!=null){
                                console.log("fetched chat documents");
                                chats.push(conversation.doc);
                            }
                        }
                    });
                    if(chats.length!=0){
                        console.log("fetched chat documents saving to local storage");
                        that.setConversationsLocal(chats);
                        q.resolve(chats);
                    }else{
                        console.log("chat documents doesn't exists");
                        q.reject(chats);
                    }
                }
            },function(err){
                console.log("something has gone wrong with fetching chat documents");
                q.reject(err);
            });
        });
        return q.promise;
    }

    /**
     * @name getConversationsLocal
     * @desc  function fetches all user conversation documents from local storage
     * @returns array of conversations
     */
    function getConversationsLocal(){
        console.log("ChatServices.getConversationsLocal()");
        var q = $q.defer();
        var conversation=JSON.parse(window.localStorage.getItem('conversation'));
        if(conversation!=null){
            console.log("local conversation exists");
            q.resolve(conversation);
        }
        else{
            console.log("local conversation doesn't exists");
            q.reject(conversation);
        }
        return q.promise;
    }

    /**
     * @name getConversationsLocal
     * @desc  function save all user conversation documents to local storage
     * @param conversationData array of conversations
     */
    function setConversationsLocal(conversationData){
        console.log("ChatServices.setConversationsLocal()");
        window.localStorage['conversation'] = JSON.stringify(conversationData);
    }

    /**
     * @name getConversation
     * @desc  function fetches specific user conversation document and saves to local storage
     * @param chatId - id of user conversation document
     * @returns conversation object
     */
    function getConversation(chatId){
        console.log("ChatServices.getConversation()");
        var that=this;
        var q = $q.defer();
        CouchDBServices.conversationExists(chatId).then(function(conversation){
            if(conversation.rows.length!=0){
                console.log("fetched document");
                var chat='';
                angular.forEach(conversation.rows,function(con){
                    if('doc' in con){
                        console.log("fetched conversation document exists");
                        chat=con.doc;
                    }
                });
                if(chat.length!=0){
                    console.log("fetched conversation document saving to local storage");
                    that.setConversationLocal(chat);
                    q.resolve(chat);
                }else{
                    console.log("conversation document doesn't exists");
                    q.reject(conversation);
                }
            }
        },function(err){
            console.log("something has gone wrong with fetching chat documents");
            q.reject(err);
        });
        return q.promise;
    }

    /**
     * @name getConversationLocal
     * @desc  function fetches specific user conversation document from local storage
     * @param chatId - id of user conversation document
     * @returns conversation object
     */
    function getConversationLocal(chatId){
        console.log("ChatServices.getConversationLocal()");
        var q = $q.defer();
        var conversations=JSON.parse(window.localStorage.getItem('conversation'));
        if(conversations!=null){
            console.log("local conversations exists");
            var stop=false;
            angular.forEach(conversations,function(conversation){
                if(!stop){
                    console.log(JSON.stringify(conversation));
                    if(conversation._id==chatId){
                        console.log("local conversation exists");
                        stop=true;
                        q.resolve(conversation);
                    }
                }
            });
        }else{
            console.log("local conversations doens't exists");
            q.reject(conversations);
        }
        return q.promise;
    }

    /**
     * @name setConversationLocal
     * @desc  function save  user conversation documents to local storage
     * @param conversationData conversation object
     */
    function setConversationLocal(conversationData){
        console.log("ChatServices.setConversationLocal()");
        var that=this;
        this.getConversationsLocal().then(function(chats){
            console.log("fetched local conversations");
            var stop=false;
            angular.forEach(chats,function(chat){
                if(!stop){
                    if(chat._id==conversationData._id) {
                        console.log("finded conversation in local conversations, updating conversation");
                        stop = true;
                        chats.splice(chats.indexOf(chat),1);
                        chats.push(conversationData);
                        that.setConversationsLocal(chats);
                    }
                }
            });
            if(!stop){
                console.log("not finded conversation in local conversations, saving new conversation");
                chats.push(conversationData);
                that.setConversationsLocal(chats);
            }
        },function(empty){
            console.log("local conversations doesn't exists, saving conversation");
            that.setConversationsLocal([conversationData]);
        });
    }

    /**
     * @name getParticipantsInfo
     * @desc  function returns sender and recipient informationa
     * @param chatId conversation document id
     * @returns sender and recipient informationa
     */
    function getParticipantsInfo(chatId){
        console.log("ChatServices.getParticipantsInfo()");
        var q = $q.defer();
        var userData=UserSessionServices.getUser();
        var sender={
            id:userData._id,
            firstName:userData.firstName,
            lastName:userData.lastName
        };
        var recipient={
            id:'',
            firstName:'',
            lastName:''
        };
        var chatIdArray=chatId.split(';');
        var toUserId=chatIdArray[0]==sender.id ? chatIdArray[1] : chatIdArray[0];
        angular.forEach(userData.contacts,function(contact){
            if(contact.phone===toUserId){
                console.log("finded recipient info data");
                recipient.id=toUserId;
                recipient.firstName=contact.firstName;
                recipient.lastName=contact.lastName;
            }
        });
        q.resolve({sender:sender,recipient:recipient});
        return q.promise;
    }

    /**
     * @name sendMessage
     * @desc  function for sending chat message, create or update conversation document with new message
     * @param message object with new message and other properties
     * @returns info about successfully or not successfully created/updated conversation document
     */
    function sendMessage(message,chatId,chatExists){
        console.log("ChatServices.sendMessage()");
        var q = $q.defer();
        if(!chatExists){
            console.log("conversation doens't exists");
            CouchDBServices.createDocument(message).then(function(success){
                console.log("created conversation document");
                q.resolve(success);
            },function(err){
                console.log("error when creating conversation document");
                q.reject(err);
            });
        }else{
            console.log("conversation already exists");
            CouchDBServices.updateDocument(chatId,message).then(function(success){
                console.log("updated conversation document");
                q.resolve(success);
            },function(err){
                console.log("error when updating conversation document");
                q.reject(err);
            });
        }
        return q.promise;
    }
}

