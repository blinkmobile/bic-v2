/*jslint browser:true, sloppy:true, white:true*/
/*jslint browser:true, sloppy:true, white:true*/
/*global $:true, Modernizr:true*/
/*global deviceVars:true, MyAnswers:true, siteVars:true, log:true*/
/*global currentConfig:true*/

var activityIndicatorTop, $navBar;
document.getElementById('startUp-loadDevice').className = 'working';
MyAnswers.deviceDeferred = new $.Deferred();

function init_device() {
  var $activityIndicator = $('#activityIndicator'),
      matches;
  log('init_device()');
  deviceVars.engineVersion = navigator.userAgent.match(/WebKit\/(\d+)/);
  deviceVars.engineVersion = deviceVars.engineVersion !== null ? deviceVars.engineVersion[1] : 525;
  deviceVars.useCSS3animations = deviceVars.engineVersion >= 532; // iOS 4 doesn't uglify forms
  deviceVars.scrollProperty = deviceVars.engineVersion >= 532 ? '-webkit-transform' : 'top';
  deviceVars.scrollValue = deviceVars.engineVersion >= 532 ? 'translateY($1px)' : '$1px';

  // caching frequently-accessed selectors
  $navBar = $('#navBoxHeader');
  activityIndicatorTop = Math.floor($(window).height() / 3);
  $activityIndicator.css('top', activityIndicatorTop);
  $('#startUp-initDevice').addClass('success');
}

/* When this function is called, PhoneGap has been initialized and is ready to roll */
function onDeviceReady() {
  try {
    log('Device Ready');
    log('URL to Load: ' + window.Settings.LoadURL);
    log('Device: ' + window.device.platform);
    log('Camera Present: ' + window.device.camerapresent);
    log('Multitasking: ' + window.device.multitasking);
    MyAnswers.cameraPresent = window.device.camerapresent;
    MyAnswers.loadURL = window.Settings.LoadURL;
    MyAnswers.multiTasking = window.device.multitasking;
    siteVars.answerSpace = window.Settings.answerSpace;
    siteVars.serverDevicePath = MyAnswers.loadURL + 'ios/' + siteVars.serverAppVersion + '/';
    deviceVars.deviceFileName = '/ios.js';
    log('AppDevicePath: ' + siteVars.serverDevicePath);
    log('AppPath: ' + siteVars.serverAppPath);
  } catch (e) {
    log('onDeviceReady exception: ');
    log(e);
  }
}

(function(window) {
  var $ = window.jQuery,
  /* @inner */
  MyAnswersDevice = function() {
    var me = this;
    /* END: var */
    me.hideLocationBar = function() {
      window.scrollTo(0, 1);
    };
    /**
         * hide the current view, and prepare the new view for display
         * @param {jQuery} $view the jQuery-selected element that will be shown.
         * @param {Boolean} reverseTransition toggle transition direction.
         * @return {jQueryPromise}
         */
    me.prepareView = function($view, reverseTransition) {
      var deferred = new $.Deferred();
      MyAnswers.dispatch.add(function() {
        var endPosition = (reverseTransition ? 'right' : 'left'),
        startPosition = (reverseTransition ? 'left' : 'right'),
        $oldView = $('.view:visible'),
        $navBoxHeader = $('#navBoxHeader'),
        safetyTimer;
        /* END: var */
        // transition the current view away
        if (window.currentConfig.footerPosition !== 'screen-bottom') {
          MyAnswers.$body.children('footer').hide();
        }
        if ($oldView.length < 1) {
          deferred.resolve();
          return;
        }
        MyAnswers.dispatch.pause('prepareView');
        $navBoxHeader.find('button').attr('disabled', 'disabled');
        $oldView.addClass('animating');
        // force the event to trigger if the DOM forgets it
        safetyTimer = setTimeout(function() {
          $oldView.trigger('webkitTransitionEnd');
        }, 1000);
        $oldView.one('webkitTransitionEnd', function(event) {
          clearTimeout(safetyTimer);
          safetyTimer = null;
          $oldView.hide();
          $oldView.removeClass('animating slid' + endPosition);
          MyAnswers.dispatch.resume('hideView');
          deferred.resolve();
        });
        setTimeout(function() {
          $oldView.addClass('slid' + endPosition);
        }, 0);
        // add information about Interaction to DOM
        if (currentMasterCategory) {
          $view.attr({
            'data-name': siteVars.config['m' + currentMasterCategory].pertinent.name
          });
        } else {
          $('#categoriesView').removeAttr('data-name');
        }
        if (currentCategory) {
          $view.attr({
            'data-name': siteVars.config['c' + currentCategory].pertinent.name
          });
        } else {
          $('#keywordListView').removeAttr('data-name');
        }
        if (currentInteraction) {
          $view.attr({
            'data-name': siteVars.config['i' + currentInteraction].pertinent.name,
            'data-type': siteVars.config['i' + currentInteraction].pertinent.type
          });
        } else {

          $('#answerView').removeAttr('data-name');
          $('#answerView').removeAttr('data-type');
        }

      });
      return deferred.promise();
    };
    me.showView = function($view, reverseTransition) {
      var deferred = new $.Deferred();
      MyAnswers.dispatch.add(function() {
        var endPosition = (reverseTransition ? 'right' : 'left'),
        startPosition = (reverseTransition ? 'left' : 'right'),
        safetyTimer;
        /* END: var */
        MyAnswers.dispatch.pause('showView');
        me.hideLocationBar();
        // move the incoming $view offscreen for compositing
        $view.hide();
        $view.addClass('slid' + startPosition);
        $view.show();
        // force the event to trigger if the DOM forgets it
        safetyTimer = setTimeout(function() {
          $view.trigger('webkitTransitionEnd');
        }, 1000);
        $view.one('webkitTransitionEnd', function(event) {
          clearTimeout(safetyTimer);
          safetyTimer = null;
          $view.removeClass('animating');
          MyAnswers.dispatch.resume('showView');
          updateNavigationButtons();
          MyAnswers.$body.children('footer').show();
          deferred.resolve();
          $view.trigger('viewShow');
        });
        setTimeout(function() {
          $view.addClass('animating');
          $view.removeClass('slid' + startPosition);
        }, 0);
      });
      return deferred.promise();
    };
    return me;
  };
  /* END: var */
  window.MyAnswersDevice = new MyAnswersDevice();
}(this));

/*
 ABOVE: all methods need implementation per device (directly called from main.js)
 BELOW: methods assisting the above methods (NOT directly called from main.js)
*/

document.getElementById('startUp-loadDevice').className = 'working success';
MyAnswers.deviceDeferred.resolve();
