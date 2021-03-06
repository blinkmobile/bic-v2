/*jslint browser:true, sloppy:true, white:true*/
/*global $:true, Modernizr:true*/
/*global deviceVars:true, MyAnswers:true, siteVars:true, log:true*/
/*global currentConfig:true*/

var activityIndicatorTop, $navBar,
    onDeviceReady = $.noop; // there are no gecko-based native applications
document.getElementById('startUp-loadDevice').className = 'working';
MyAnswers.deviceDeferred = new $.Deferred();

// ** device-specific initialisation of variables and flags **

function init_device() {
  var $activityIndicator = $('#activityIndicator');
  log('init_device()');
  deviceVars.scrollProperty = 'top';
  deviceVars.scrollValue = '$1px';

  //    deviceVars.disableXSLT = true;

  // caching frequently-accessed selectors
  $navBar = $('#navBoxHeader');
  activityIndicatorTop = Math.floor($(window).height() / 2);
  $activityIndicator.css('top', activityIndicatorTop);
  $('#startUp-initDevice').addClass('success');
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
      var deferred = new $.Deferred(),
      $oldView = $('.view:visible').not($view[0]),
      $navBoxHeader = $('#navBoxHeader');
      /* END: var */
      MyAnswers.dispatch.add(function() {
        // move the incoming $view offscreen for compositing
        $view.hide();
        $view.css({
          'z-index': 0,
          position: 'absolute'
        });
        $oldView.css({
          'z-index': 50,
          position: 'absolute'
        });
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

        $view.show();
        if (window.currentConfig.footerPosition !== 'screen-bottom') {
          MyAnswers.$body.children('footer').hide();
        }
        $navBoxHeader.find('button').prop('disabled', true);
        deferred.resolve();
      });
      return deferred.promise();
    };
    me.showView = function($view, reverseTransition) {
      var deferred = new $.Deferred(),
      $oldView = $('.view:visible').not($view[0]),
      endPosition = (reverseTransition ? 'right' : 'left'),
      startPosition = (reverseTransition ? 'left' : 'right');
      /* END: var */
      me.hideLocationBar();
      MyAnswers.dispatch.add(function() {
        if ($oldView.length !== 0) {
          // transition the old view away
          $oldView.hide('slide', {
            direction: endPosition
          }, 300, function() {
            $oldView.css('z-index', '');
            $oldView.css('position', '');
            $view.css('z-index', '');
            $view.css('position', '');
            updateNavigationButtons();
            MyAnswers.$body.children('footer').show();
            deferred.resolve();
            $view.trigger('viewShow');
          });
        } else {
          $view.css('z-index', '');
          $view.css('position', '');
          updateNavigationButtons();
          MyAnswers.$body.children('footer').show();
          deferred.resolve();
          $view.trigger('viewShow');
        }
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
