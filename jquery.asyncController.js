/**
 * Async Request Controller - jQuery plugin for requests asynchronously
 *
 * Copyright (c) 2016 lucasantanaweb@gmail.com
 *
 * Licensed under the MIT license:
 *   http://www.opensource.org/licenses/mit-license.php
 *
 * Project home:
 *   http://lucaszanevich.com.br/async-request-controller/
 *
 * Version:  1.0.0
 *
 */
(function($) {
    jQuery.fn.asyncController = function(options) {

        var defaults = {
            requests: 0,
            requestMethod: 'GET',
            requestType: 'html',
            requestAttempts: 0,
            requestAttemptsTimer: 5000,
            requestData: {},
            targetProgress: null,
            progressEffect: true,
            before: function() {},
            success: function() {},
            always: function() {}
        };

        var $this = $(this);
        var custom = $.extend({}, defaults, options);

        var settings = {
            requests: [],
            requestData: [],
            requestRunning: 0,
            requestRunningAttempts: {},
            requestCall: 0,
            requestNum: 0,
            requestNumTotal: 0,
            requestTimer: null,
            requestAgain: {},
            requestActiveAttempts: false
        }

        var returnCustom = {
            finishRequests: false
        };

        // transform requests & data order
        for (var key in custom.requests) {
            if (custom.requests.hasOwnProperty(key)) {
                settings.requests.push(custom.requests[key]);
            }
        }
        for (var key in custom.requestData) {
            if (custom.requestData.hasOwnProperty(key)) {
                settings.requestData.push(custom.requestData[key]);
            }
        }

        if (jQuery.type(settings.requests.length) === "undefined" || settings.requests == 0)
            return console.log('No data requests');

        // reset and config settings
        settings.requestCall = 0;
        settings.requestActiveAttempts = false;
        settings.requestRunningAttempts = {};
        settings.requestAgain = {};
        settings.requestNum = settings.requests.length;
        settings.requestNumTotal = settings.requests.length;

        setTimeout(function() {
            callProgress(0);
            callTimer(500);
        }, 500);

        var callTimer = function(delay) {
            settings.requestTimer = setInterval(function() {
                if (settings.requestRunning == 0 && settings.requestNum != 0)
                    callRequest();
            }, delay);
        }

        var callRequest = function() {
            $.ajax({
                    url: settings.requests[settings.requestCall],
                    type: custom.requestMethod,
                    dataType: custom.requestType,
                    data: settings.requestData[settings.requestCall],
                    beforeSend: function() {
                        settings.requestRunning = 1;
                        custom.before();
                    }
                })
                .done(function(responseData) {
                    custom.success(responseData);
                })
                .always(function(jqXHR) {
                    settings.requestRunning = 0;
                    var requestWithError = false;
                    if (jQuery.type(settings.requestRunningAttempts[settings.requestCall]) === "undefined") {
                        if (jQuery.type(jqXHR.abort) !== "undefined") {
                            if (jqXHR.abort.length != 0) {
                                settings.requestAgain[settings.requestCall] = settings.requests[settings.requestCall];
                                settings.requestRunningAttempts[settings.requestCall] = 1;
                                requestWithError = true;
                            }
                        }
                    } else {
                        if (jQuery.type(jqXHR.abort) === "undefined")
                            settings.requestRunningAttempts[settings.requestCall] = custom.requestAttempts;
                    }

                    verifyStatus();
                    if (settings.requestCall == 0 && !settings.requestActiveAttempts)
                        settings.requestCall = settings.requestNumTotal;
                    if (!settings.requestActiveAttempts && !requestWithError) {
                        var progressCalc = Math.floor((settings.requestCall / settings.requestNumTotal) * 100);
                        callProgress(progressCalc);
                    }

                    if (settings.requestNum == 0)
                        returnCustom.finishRequests = true;

                    custom.always(returnCustom);
                });
        }

        var verifyStatus = function() {
            if (settings.requestNum > 1) {
                if (settings.requestActiveAttempts) {
                    if (settings.requestRunningAttempts[settings.requestCall] >= custom.requestAttempts) {
                        delete settings.requestAgain[settings.requestCall];
                        delete settings.requestRunningAttempts[settings.requestCall];
                        settings.requestNum = settings.requestNum - 1;
                        settings.requestCall = Object.keys(settings.requestAgain)[0];
                    } else {
                        settings.requestRunningAttempts[settings.requestCall] = settings.requestRunningAttempts[settings.requestCall] + 1;
                    }
                } else {
                    settings.requestNum = settings.requestNum - 1;
                    settings.requestCall = settings.requestCall + 1;
                }
            } else {
                if (settings.requestActiveAttempts) {
                    if (settings.requestRunningAttempts[settings.requestCall] >= custom.requestAttempts) {
                        delete settings.requestAgain[settings.requestCall];
                        delete settings.requestRunningAttempts[settings.requestCall];
                        settings.requestNum = 0;
                        settings.requestCall = 0;
                        clearInterval(settings.requestTimer);
                        settings.requestActiveAttempts = false;
                    } else {
                        settings.requestRunningAttempts[settings.requestCall] = settings.requestRunningAttempts[settings.requestCall] + 1;
                    }
                } else {
                    var checkAttempts = verifiyAttempts();
                    if (!checkAttempts) {
                        settings.requestNum = 0;
                        settings.requestCall = 0;
                        clearInterval(settings.requestTimer);
                    }
                }
            }
        }

        var verifiyAttempts = function() {
            var numRequestsAgain = Object.keys(settings.requestAgain);
            if (custom.requestAttempts == 0 || numRequestsAgain.length == 0 || settings.requestActiveAttempts) {
                return false;
            } else {
                settings.requestNum = numRequestsAgain.length;
                settings.requestCall = numRequestsAgain[0];
                settings.requestActiveAttempts = true;
                clearInterval(settings.requestTimer);
                callTimer(custom.requestAttemptsTimer);
                return true;
            }
        }

        var callProgress = function(progressValue) {
            var divTarget = {};
            divTarget[custom.targetProgress] = progressValue + '%';
            if (progressValue == 0) {
                $this.animate(divTarget, 0);
                return;
            }
            if (custom.progressEffect)
                $this.animate(divTarget, 1500);
            else
                $this.animate(divTarget, 0);
        }

    };
})(jQuery);