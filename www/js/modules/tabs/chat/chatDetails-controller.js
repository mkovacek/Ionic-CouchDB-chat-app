(function() {
    angular.module('chatDetails.controller', []).controller('ChatDetailsCtrl', ChatDetailsCtrl);

    ChatDetailsCtrl.$inject = ['ChatServices','$scope','$stateParams', '$ionicScrollDelegate', '$timeout', '$interval'];

    /**
     * @name ChatDetailsCtrl
     * @desc Controller for chat details (messagess) screen
     * @param ChatServices - service for actions with user conversations.
     * @param $scope - is an object that refers to the application model.
     * @param $stateParams - service that contains url parameter values
     * @param $ionicScrollDelegate - service that control all scroll views
     * @param $timeout - serices for delayed execution function
     * @param $interval - service for execution functions every delay milliseconds
     */
    function ChatDetailsCtrl(ChatServices,$scope, $stateParams, $ionicScrollDelegate, $timeout, $interval) {
        console.log("ChatDetailsCtrl");
        var that=this;
        this._$scope=$scope;
        this._$ionicScrollDelegate=$ionicScrollDelegate;
        this._$timeout=$timeout;
        this._$interval=$interval;
        this._ChatServices=ChatServices;
        this.chatId=$stateParams.chatId;

        this.chatExists=false;
        this.sender={
            id:'',
            firstName:'',
            lastName:''
        };
        this.recipient={
            id:'',
            firstName:'',
            lastName:''
        };
        this.viewScroll = this._$ionicScrollDelegate.$getByHandle('userMessageScroll');
        this.messages=null;
        this.inputMessage='';
        this.messageCheckTimer;
        this.footerBar;
        this.scroller;
        this.txtInput;

        this._ChatServices.getParticipantsInfo(this.chatId)
            .then(function(info){
                console.log("fetched info about sender and recipient");
                that.sender=info.sender;
                that.recipient=info.recipient;
            }
        );
        this.init();
    }

    ChatDetailsCtrl.prototype.init=function(){
        console.log("ChatDetailsCtrl.init()");
        var that=this;
        this._$scope.$on('$ionicView.enter', function() {
            console.log("user enter to view");
            that._ChatServices.getConversationLocal(that.chatId).then(function(chat){
                console.log("fetched local conversation");
                that.messages=chat;
                that._$timeout(function() {
                    console.log("scroll to end of view");
                    that.viewScroll.scrollBottom(true);
                }, 0);
                that.chatExists=true;
                that.getMessages(); //možda maknuti, kad je interval 5 sec?
            },function(err){
                that.getMessages();
            });

            that._$timeout(function() {
                console.log("fetched footer, scroller and txt input values");
                that.footerBar = document.body.querySelector('#userMessagesView .bar-footer');
                that.scroller = document.body.querySelector('#userMessagesView .scroll-content');
                that.txtInput = angular.element(that.footerBar.querySelector('textarea'));
            }, 0);

            that.messageCheckTimer = that._$interval(function() {
                console.log("fetching conversation in interval");
                that.getMessages();
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

        this._$scope.$watch('detCtrl.inputMessage', function(newValue, oldValue) {
            console.log("users is typing message");
            that._$timeout(function() {
                console.log("scroll to end of view");
                that.viewScroll.scrollBottom(true);
            }, 0);
            if (!newValue)
                newValue = '';
        });

        // I emit this event from the monospaced.elastic directive
        this._$scope.$on('taResize', function(e, ta) {
            console.log("resizing content view");
            if (!ta) return;

            var taHeight = ta[0].offsetHeight;
            if (!that.footerBar) return;

            var newFooterHeight = taHeight + 10;
            newFooterHeight = (newFooterHeight > 44) ? newFooterHeight : 44;
            that.footerBar.style.height = newFooterHeight + 'px';
            that.scroller.style.bottom = newFooterHeight + 'px';
        });
    };

    /**
     * @name fetchConversations
     * @desc  function fetch conversation and perform some actions
     */
    ChatDetailsCtrl.prototype.getMessages=function(){
        console.log("ChatDetailsCtrl.getMessages()");
        var that=this;
        this._ChatServices.getConversation(this.chatId).then(function(chat){
            console.log("fetched remote conversation");
            if(JSON.stringify(that.messages.messages)!=JSON.stringify(chat.messages)){
                console.log("local conversation != remote conversation");
                that.messages=chat;
                that._$timeout(function() {
                    console.log("scroll to end of view");
                    that.viewScroll.scrollBottom(true);
                }, 0);
                navigator.notification.beep(2);
                navigator.vibrate([200,100,300]);
            }
            that.chatExists=true;
        },function(empty){
            console.log("remote conversation don't exists");
            that.chatExists=false;
        });
    };

    /**
     * @name sendMessage
     * @desc  function for sending messages
     */
    ChatDetailsCtrl.prototype.sendMessage=function(){
        console.log("ChatDetailsCtrl.sendMessage()");
        var that=this;
        var allMessages='';
        if(that.messages!=null){
            if('messages' in that.messages){
                if(that.messages.messages.length>0){
                    console.log("messages exists");
                    allMessages=that.messages.messages;
                }
            }
        }else{
            console.log("messages don't exists");
            allMessages=[];
        }

        var sendTime=moment().valueOf();
        var newMessage={
            user:this.sender.id,
            msg:this.inputMessage,
            sendTime:sendTime
        };

        allMessages.push(newMessage);
        var myProperty=this.sender.id.toString();
        var recipientProperty=this.recipient.id.toString();

        if(this.chatExists){
            console.log("conversation exists");
            this.messages={
                type:'conversation',
                lastMsg:this.inputMessage,
                lastMsgTime:sendTime,
                messages:allMessages
            };
            this.messages[myProperty]={
                'firstName':this.sender.firstName,
                'lastName' :this.sender.lastName
            };
            this.messages[recipientProperty]={
                'firstName':this.recipient.firstName,
                'lastName' :this.recipient.lastName
            };
        }else{
            console.log("conversation don't exists");
            this.messages={
                _id: this.chatId,
                type:'conversation',
                lastMsg:this.inputMessage,
                lastMsgTime:sendTime,
                messages:allMessages
            };

            this.messages[myProperty]={
                'firstName':this.sender.firstName,
                'lastName' :this.sender.lastName
            };

            this.messages[recipientProperty]={
                'firstName':this.recipient.firstName,
                'lastName' :this.recipient.lastName
            };

        }

        this.keepKeyboardOpen();
        this._ChatServices.sendMessage(this.messages,this.chatId,this.chatExists)
            .then(function(success){
                console.log("message was sent successfully");
                that.chatExists=true;
                that.inputMessage = '';
                that._$timeout(function() {
                    console.log("keep keyboard open, scroll to end of view");
                    that.keepKeyboardOpen();
                    that.viewScroll.scrollBottom(true);
                }, 0);
                that.messages._id=that.chatId;
                that._ChatServices.setConversationLocal(that.messages);
            },function(err){
                console.log("message wasn't sent successfully");
                console.log(err);
            }
        );
    };

    /**
     * @name keepKeyboardOpen
     * @desc  function keeps keyboard opened
     */
    ChatDetailsCtrl.prototype.keepKeyboardOpen=function(){
        console.log("ChatDetailsCtrl.keepKeyboardOpen()");
        var that=this;
        this.txtInput.one('blur', function() {
            that.txtInput[0].focus();
        });
    };

})();
