"use strict";
(function () {
    angular.module('application').controller('myProfileCtrl',
        ["$scope",
            "UserContextService",
            "ApiService",
            "LoginService",
            "$location",
            "DummyDataService",
            "$state",
            "MixPanelService",
            "SignalService", "EventService",
            function ($scope, UserContextService, ApiService, LoginService, $location, DummyDataService, $state, MixPanelService, SignalService, EventService) {
                MixPanelService.track("My Profile");
                var userId = UserContextService.getCurrentUserId();
                $state.go('myProfile.signal');
                $scope.signal = {
                    content: '',
                    taggedPeople: [],
                    attachments: []
                };

                $scope.groupCollection = {};

                $scope.signalOffSet = 0;

                UserContextService.getProfileById(userId).then(function (data) {
                    $scope.myPhoto = data.connData.imgSrc;
                    $scope.myName = data.connData.firstName + " " + data.connData.lastName;
                    $scope.myEmail = data.connData.email;
                });

                SignalService.getSignals($scope.signalOffSet).then(function (signals) {
                    $scope.signals = [];
                    angular.forEach(signals.data, function (signal) {
                        if (signal.hasOwnProperty('doc')) {
                            signal.newComment = {
                                attachments : []
                            };
                            $scope.signals.push(signal);
                        }
                    });
                });

                EventService.on('onBodyScroll', function (event) {

                });

                $scope.onAttachmentChange = function (attachment) {
                    var attachments = window.event.target.files;

                    angular.forEach(attachments, function (attachment) {
                        var fileReader = new FileReader();
                        fileReader.onload = function (fileLoadedEvent) {
                            var attachmentData = fileLoadedEvent.target.result.replace(/^data(.*?),/, '');
                            $scope.signal.attachments.push({
                                name: attachment.name,
                                fileBase64: attachmentData
                            });
                            $scope.$apply();
                        }
                        fileReader.readAsDataURL(attachment);
                    });
                };

                $scope.removeAttachment = function (attachment) {
                    var attachmentIndex = $scope.signal.attachments.indexOf(attachment);
                    $scope.signal.attachments.splice(attachmentIndex, 1);
                }

                $scope.showPeoplePicker = function () {
                    SignalService.getConnections().then(function (connections) {
                        $scope.peoplePickerFlag = true;

                        $scope.groupCollection["connType"] = _.groupBy(connections, function (m) {
                            return m.connType;
                        });
                        $scope.groupCollection["entityType"] = _.groupBy(connections, function (m) {
                            return m.entityType;
                        });
                        $scope.groupCollection["nameType"] = _.groupBy(connections, function (m) {
                            return m.title.charAt(0);
                        });

                        if ($scope.selectedPeoplePickerGroup) {
                            $scope.selectedGroup = $scope.groupCollection[$scope.selectedPeoplePickerGroup.key];
                        } else {
                            $scope.selectedGroup = $scope.groupCollection["nameType"];
                        }
                    });
                };

                $scope.toggleSelectPeople = function (person) {
                    person.isSelected = !person.isSelected;

                    if ($scope.signal.taggedPeople.indexOf(person) == -1) {
                        $scope.signal.taggedPeople.push(person);
                    } else {
                        $scope.signal.taggedPeople.splice($scope.signal.taggedPeople.indexOf(person), 1);
                    }
                }

                $scope.findPeople = function (peopleSearchText) {

                }

                $scope.updatePeoplePickerResults = function (selectedPeoplePickerGroup) {
                    if (selectedPeoplePickerGroup) {
                        $scope.selectedGroup = $scope.groupCollection[selectedPeoplePickerGroup.key];
                    }
                }

                $scope.postSignal = function (signal) {
                    signal.attachmentUrl = [];
                     if(!signal.attachments.length){
                         SignalService.saveSignal(signal)
                             .then(function(response){

                                 var newSignal = {
                                     doc: response.data,
                                     newComment:{
                                         attachments:[]
                                     },
                                     comments:[]
                                 }

                                 $scope.signals.unshift(newSignal);

                                 $scope.signal = {
                                     content: '',
                                     taggedPeople: [],
                                     attachments: [],
                                     attachmentUrl:[]
                                 };

                             });
                     }else{
                         angular.forEach(signal.attachments, function (attachment) {
                             SignalService.attachNewFileMobile(attachment).then(function (response) {

                                 signal.attachmentUrl.push(response.url);

                                 if (signal.attachmentUrl.length == signal.attachments.length) {
                                     SignalService.saveSignal(signal).then(function (response) {
                                         var newSignal = {
                                             doc: response.data,
                                             newComment:{
                                                 attachments:[]
                                             },
                                             comments:[]
                                         }
                                         $scope.signals.unshift(newSignal);
                                         $scope.signal = {
                                             content: '',
                                             taggedPeople: [],
                                             attachments: [],
                                             attachmentUrl:[]
                                         };
                                     });
                                 }

                             });
                         });
                     }
                }

                $scope.saveDisLike = function (signal) {
                    SignalService.saveFeedback('n', signal._id)
                        .then(function (response) {
                            if (response.code) {
                                signal.fbYes = response.data.fbYes;
                                signal.fbNo = response.data.fbNo;
                            }
                        });
                    ;
                }

                $scope.saveLike = function (signal) {
                    SignalService.saveFeedback('y', signal._id)
                        .then(function (response) {
                            if (response.code) {
                                signal.fbYes = response.data.fbYes;
                                signal.fbNo = response.data.fbNo;
                            }
                        });
                }

                $scope.loadMoreSignal = function () {
                    $scope.signalOffSet += 10;
                    SignalService.getSignals($scope.signalOffSet).then(function (signals) {
                        angular.forEach(signals.data, function (signal) {
                            if (signal.hasOwnProperty('doc')) {
                                $scope.signals.push(signal);
                            }
                        });
                    });
                }

                $scope.onCommentAttachmentChange = function (signal) {
                    var attachments = window.event.target.files;
                    angular.forEach(attachments, function (attachment) {
                        var fileReader = new FileReader();
                        fileReader.onload = function (fileLoadedEvent) {
                            var attachmentData = fileLoadedEvent.target.result.replace(/^data(.*?),/, '');
                            signal.newComment.attachments.push({name: attachment.name, fileBase64: attachmentData});
                            $scope.$apply();
                        }
                        fileReader.readAsDataURL(attachment);
                    });
                }

                $scope.saveNewComment = function (signal) {

                    signal.newComment.attachmentUrls = [];

                    if(signal.newComment.attachments.length==0){
                        SignalService.saveComment(signal).then(function (response) {
                            if (response.code) {
                                signal.comments.push(response.data);
                                signal.newComment = {};
                                signal.newComment.attachments = [];
                                signal.newComment.attachmentUrls = [];
                            }
                        });
                        return;
                    }

                    angular.forEach(signal.newComment.attachments, function (attachment) {
                        SignalService.attachNewFileMobile(attachment).then(function (response) {

                            signal.newComment.attachmentUrls.push(response.url);

                            if (signal.newComment.attachmentUrls.length == signal.newComment.attachments.length) {
                                SignalService.saveComment(signal).then(function (response) {
                                    if (response.code) {
                                        signal.comments.push(response.data);
                                        signal.newComment = {};
                                        signal.newComment.attachments = [];
                                        signal.newComment.attachmentUrls = [];
                                    }
                                });
                            }

                        });
                    });
                }

                $scope.removeNewCommentAttachment = function (attachment, signal) {
                    signal.newComment.attachments.splice(signal.newComment.attachments.indexOf(attachment), 1);
                }

            }]);
})();