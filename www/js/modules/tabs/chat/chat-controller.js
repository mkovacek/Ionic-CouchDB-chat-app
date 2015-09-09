(function() {
    angular.module('chat.controller', []).controller('ChatCtrl', ChatCtrl);

    ChatCtrl.$inject = ['ChatServices','$scope','$interval','UserSessionServices'];

    /**
     * @name ChatCtrl
     * @desc Controller for chat list screen
     * @param $scope - is an object that refers to the application model.
     * @param $interval - service for execution functions every delay milliseconds
     * @param UserSessionServices - service for checking user data and session
     */
    function ChatCtrl(ChatServices,$scope,$interval,UserSessionServices) {
        console.log("ChatCtrl");
        this._$interval=$interval;
        this._$scope=$scope;
        this._ChatServices=ChatServices;
        this._UserSessionServices=UserSessionServices;
        this.chats='';
        this.messageCheckTimer;
        this.sender={
            id:'',
            firstName:'',
            lastName:''
        };
        this.myId=this._UserSessionServices.getUser()._id;
        this.init();
    }

    /**
     * @name init
     * @desc  function that watch enter and leave events to view and perform some actions
     */
    ChatCtrl.prototype.init=function(){
        console.log("ChatCtrl.init()");
        var that=this;
        this._$scope.$on('$ionicView.enter', function() {
            console.log("user enter to view");
            that._ChatServices.getConversationsLocal()
                .then(function(chats){
                    console.log("fetched local conversations");
                    that.chats=chats;
                    angular.forEach(that.chats,function(chat){
                        var chatIdArray=chat._id.split(';');
                        var toUserId=chatIdArray[0]==that.myId ? chatIdArray[1] : chatIdArray[0];
                        chat.sender=toUserId;
                    });
                    that.fetchConversations();//možda maknuti, kad je interval 5 sec?
                },function(empty){
                    console.log("local conversations doesn't exists");
                    that.fetchConversations();
                }
            );

            that.messageCheckTimer = that._$interval(function() {
                console.log("fetching conversations in interval");
                that.fetchConversations();
            }, 5000);
        });

        this._$scope.$on('$ionicView.leave', function() {
            console.log("user left view");
            if (angular.isDefined(that.messageCheckTimer)) {
                console.log("undefined-ing messageCheckTimer");
                that._$interval.cancel(that.messageCheckTimer);
                that.messageCheckTimer = undefined;
            }
        });
    };

    /**
     * @name fetchConversations
     * @desc  function fetch conversations and perform some actions
     */
    ChatCtrl.prototype.fetchConversations=function(){
        console.log("ChatCtrl.fetchConversations()");
        var that=this;
        this._ChatServices.getConversations()
            .then(function(chats){
                console.log("fetched remote conversations");
                var newRevisions=_.difference(_.pluck(chats,"_rev"), _.pluck(that.chats,"_rev"));
                if(newRevisions.length>0){
                    console.log("local conversations != remote conversations");
                    angular.forEach(chats,function(chat){
                        var chatIdArray=chat._id.split(';');
                        var toUserId=chatIdArray[0]==that.myId ? chatIdArray[1] : chatIdArray[0];
                        chat.sender=toUserId;
                        angular.forEach(that.chats,function(c){
                            if(chat._id==c._id && JSON.stringify(chat.messages)!=JSON.stringify(c.messages)){
                                console.log("new messages in existing conversation");
                                chat.newMsg=true;
                                navigator.notification.beep(2);
                                navigator.vibrate([200,100,300]);
                            }
                        });
                    });
                    var newMsgId=_.difference(_.pluck(chats,"_id"), _.pluck(that.chats,"_id"));
                    if(newMsgId.length>0){
                        console.log("new conversation");
                        angular.forEach(chats,function(chat){
                            angular.forEach(newMsgId,function(msg){
                                if(chat._id==msg){
                                    chat.newMsg=true;
                                    cordova.plugins.notification.local.schedule({
                                        id: 1,
                                        title: chat[chat.sender].firstName+" "+chat[chat.sender].lastName,
                                        text: chat.lastMsg,
                                        at: new Date()
                                    });
                                    navigator.vibrate([200,100,300]);
                                }
                            });
                        });
                    }
                    that.chats=chats;
                }
            },function(empty){
                console.log("remote conversation don't exists "+empty);
            }
        );
    };
})();
