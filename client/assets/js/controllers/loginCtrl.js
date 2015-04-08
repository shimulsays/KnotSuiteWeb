'use strict';
(function () {
    angular.module('application')
        .controller('LoginCtrl',
        ['$scope', 'LoginService', '$location', '$rootScope', 'EventService','MixPanelService','UserContextService',
            function ($scope, LoginService, $location, $rootScope, EventService,MixPanelService,UserContextService) {
                MixPanelService.track("Login Page");

                if (UserContextService.isLoggedIn()) {
                    $location.path('/myProfile');
                }

                //$scope.user = {
                //    loginEmail:"brian.tobey123@gmail.com",
                //    loginPassword:"@ddinstagram",
                //    clientURI:"NO_CLIENT_URI",
                //    timeOffset:360
                //}

                $scope.user = {
                    loginEmail:"",
                    loginPassword:"",
                    clientURI:"NO_CLIENT_URI",
                    timeOffset:360
                }

                $scope.loginNow = function () {
                    LoginService.sendLoginRequest($scope.user).then(function (data) {
                        if(data.accountStatus == 2){
                            UserContextService.saveCurrentUserData(data.userObj);
                            //$rootScope.userData = data.userObj;
                            EventService.trigger('signedIn');
                            EventService.trigger('updateProfilePicture',data.userObj);
                            $location.path('/myProfile');
                        }
                    });
                };

            }]);
})();

