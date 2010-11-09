var backButtonHeader;
var helpButton;
var homeButton;

function init_device()
{
	MyAnswers.log('init_device()');
	deviceVars.engineVersion = navigator.userAgent.match(/WebKit\/(\d+)/);
	deviceVars.engineVersion = deviceVars.engineVersion != null ? deviceVars.engineVersion[1] : 525;
	deviceVars.useCSS3animations = deviceVars.engineVersion >= 532; // iOS 4 doesn't uglify forms
	deviceVars.scrollProperty = deviceVars.engineVersion >= 532 ? '-webkit-transform' : 'top';
	deviceVars.scrollValue = deviceVars.engineVersion >= 532 ? 'translateY($1px)' : '$1px';

	deviceVars.device = "ipad";
	
	// caching frequently-accessed selectors
	backButtonHeader = $('#backButtonHeader');
	helpButton = $('#helpButton');
	homeButton = $('.homeButton');
}

/* When this function is called, PhoneGap has been initialized and is ready to roll */
function onDeviceReady() {
  MyAnswers.log("Device Ready");
  MyAnswers.log("URL to Load: " + window.Settings.LoadURL);
  MyAnswers.log("Device: " + window.device.platform);
  MyAnswers.log("Camera Present: " + window.device.camerapresent);
  MyAnswers.log("Multitasking: " + window.device.multitasking);
  MyAnswers.cameraPresent = window.device.camerapresent;
  MyAnswers.loadURL = window.Settings.LoadURL;
  siteVars.serverDomain = MyAnswers.loadURL.match(/:\/\/(.[^/]+)/)[1];
  MyAnswers.domain = "http://" + siteVars.serverDomain + "/";
  MyAnswers.log("Domain: " + MyAnswers.domain);
  MyAnswers.multiTasking = window.device.multitasking;
  siteVars.serverAppVersion = window.Settings.codeVersion;
  siteVars.serverAppPath = MyAnswers.loadURL + 'common/' + siteVars.serverAppVersion + '/';
  siteVars.answerSpace = window.Settings.answerSpace;
	deviceVars.device = "ipad_pg";
	siteVars.serverDevicePath = MyAnswers.loadURL + 'ipad/' + siteVars.serverAppVersion + '/';
	deviceVars.deviceFileName = '/ipad.js';
  MyAnswers.log("AppDevicePath: " + siteVars.serverDevicePath);
  MyAnswers.log("AppPath: " + siteVars.serverAppPath);
}

/*
 The purpose of the functions "prepare...ForDevice()" is to establish the
 buttons that can be displayed on the navBar and the function of the buttons
 where they differ.
 The visibility of the leftBox is also controlled at this stage.
*/

function prepareAnswerSpacesListViewForDevice()
{
  MyAnswers.log('prepareAnswerSpacesListViewForDevice()');
  backButtonHeader.addClass('hidden');
  homeButton.addClass('hidden');
  helpButton.addClass('hidden');
  hideLeftBox();
	$('#mainLabel').html('answerSpaces');
}

function prepareMasterCategoriesViewForDevice()
{
  MyAnswers.log('prepareMasterCategoriesViewForDevice()');
  backButtonHeader.addClass('hidden');
  homeButton.addClass('hidden');
  hideLeftBox();
	if (typeof(siteConfig.help) != 'string')
		helpButton.addClass('hidden');
	else
		helpButton.removeClass('hidden');
}

function prepareCategoriesViewForDevice()
{
  MyAnswers.log('prepareCategoriesViewForDevice()');
  //backButtonHeader.unbind('click');
  if (hasMasterCategories)
  {
	 backButtonHeader.removeClass('hidden');
		homeButton.removeClass('hidden');
	 populateLeftBoxWithMasterCategories();
	 showLeftBox();
  }
  else
  {
	 hideLeftBox();
	 backButtonHeader.addClass('hidden');
	  homeButton.addClass('hidden');
  }
	if (typeof(siteConfig.help) != 'string')
		helpButton.addClass('hidden');
	else
		helpButton.removeClass('hidden');
}

function prepareKeywordListViewForDevice(category)
{
  MyAnswers.log('prepareKeywordListViewForDevice()');
  if (hasVisualCategories)
  {
		backButtonHeader.removeClass('hidden');
		homeButton.removeClass('hidden');
  }
  else if (hasMasterCategories)
  {
		backButtonHeader.removeClass('hidden');
		homeButton.removeClass('hidden');
  }
  else
  {
		backButtonHeader.addClass('hidden');
	  homeButton.addClass('hidden');
  }
  if (hasCategories)
  {
		populateLeftBoxWithCategories(currentMasterCategory);
		showLeftBox();
  }
  else if (hasMasterCategories)
  {
		populateLeftBoxWithMasterCategories();
		showLeftBox();
  }
	if (typeof(siteConfig.help) != 'string')
		helpButton.addClass('hidden');
	else
		helpButton.removeClass('hidden');
}

function prepareKeywordViewForDevice(oneKeyword, showHelp)
{
  MyAnswers.log('prepareKeywordViewForDevice(): ' + oneKeyword + ' ' + showHelp);
	if (oneKeyword)
	{
		backButtonHeader.addClass('hidden');
	  homeButton.addClass('hidden');
	}
	else
	{
		backButtonHeader.removeClass('hidden');
		homeButton.removeClass('hidden');
	}
	if (showHelp)
		helpButton.removeClass('hidden');
	else
		helpButton.addClass('hidden');
}

function prepareAnswerViewForDevice()
{
  MyAnswers.log('prepareAnswerViewForDevice()');
  backButtonHeader.removeClass('hidden');
	homeButton.removeClass('hidden');
	if (typeof(siteConfig.keywords[currentKeyword].help) == 'string')
	{
		helpButton.removeClass('hidden');
	}
	else
	{
		helpButton.addClass('hidden');
	}
}

function prepareSecondLevelAnswerViewForDevice()
{
  MyAnswers.log('prepareSecondLevelAnswerViewForDevice()');
  backButtonHeader.removeClass('hidden');
	homeButton.removeClass('hidden');
  helpButton.addClass('hidden');
}

function prepareHelpViewForDevice()
{
  MyAnswers.log('prepareHelpViewForDevice()');
  backButtonHeader.removeClass('hidden');
	homeButton.removeClass('hidden');
  helpButton.addClass('hidden');
}

function prepareLoginViewForDevice()
{
  MyAnswers.log('prepareLoginViewForDevice()');
  backButtonHeader.removeClass('hidden');
	homeButton.removeClass('hidden');
  helpButton.addClass('hidden');
}

function prepareNewLoginViewForDevice()
{
  MyAnswers.log('prepareLoginViewForDevice()');
  backButtonHeader.removeClass('hidden');
	homeButton.removeClass('hidden');
  helpButton.addClass('hidden');
}

function prepareActivateLoginViewForDevice()
{
  MyAnswers.log('prepareLoginViewForDevice()');
  backButtonHeader.removeClass('hidden');
	homeButton.removeClass('hidden');
  helpButton.addClass('hidden');
}

function populateTextOnlyCategories(masterCategory)
{
	MyAnswers.log('populateTextOnlyCategories(): ' + masterCategory);
	$('#leftLabel').html(hasMasterCategories? siteConfig.master_categories[masterCategory].name : 'Categories');
	var leftContent = $('#leftContent');
	leftContent.empty();
	var order = hasMasterCategories ? siteConfig.master_categories[masterCategory].categories : siteConfig.categories_order;
	var list = siteConfig.categories;
	var html = "<ul id='categoriesList'>"
	for (id in order)
	{
		if (list[order[id]].status != 'active')
			continue;
		html += "<a onclick=\"showKeywordListView('" + order[id] + "')\">";
		html += "<li id='leftcategory" + order[id] + "'>" + list[order[id]].name + "</li>";
		html += "</a>";
	}
	html += "</ul>";
	leftContent.append(html);
	currentCategory = currentCategory ? currentCategory : siteConfig.default_category;
	$('#leftcategory' + currentCategory).addClass('selected');
}

function setCurrentView(view, reverseTransition)
{
  MyAnswers.log('setCurrentView(): ' + view + ' ' + reverseTransition);
	$('body').trigger('taskBegun');
	setTimeout(function() {
		window.scrollTo(0, 1);
		var entranceDirection = (reverseTransition ? 'left' : 'right');
		var endPosition = (reverseTransition ? 'right' : 'left');
		var startPosition = (reverseTransition ? 'left' : 'right');
		var currentView = $('.view:visible');
		var newView = $('#' + view);
		if (currentView.size() == 0)
		{
			newView.show();
		}
		else if (currentView.attr('id') == newView.attr('id'))
		{
			newView.hide();
			newView.addClass('slid' + startPosition);
			newView.show();
			setTimeout(function() {
				newView.addClass('animating');
				newView.removeClass('slid' + startPosition)
			}, 0);
			setTimeout(function() {
				newView.removeClass('animating');
			}, 300);
		}
		else
		{
			newView.hide();
			newView.addClass('slid' + startPosition);
			currentView.addClass('animating');
			newView.show();
			newView.addClass('animating');
			setTimeout(function() {
				newView.removeClass('slid' + startPosition)
				currentView.addClass('slid' + endPosition)
			}, 0);
			setTimeout(function() {
				newView.removeClass('animating');
				currentView.hide();
				currentView.removeClass('animating slid' + endPosition);
			}, 300);
		}
		setTimeout(function() {
			$('body').trigger('taskComplete');
			$('body').trigger('transitionComplete', [view]);
		}, 350);
	}, 0);
}

/*
 ABOVE: all methods need implementation per device (directly called from main.js)
 BELOW: methods assisting the above methods (NOT directly called from main.js)
*/

function showLeftBox()
{
  if (!$('#leftBox').hasClass('leftShown'))
  {
	 MyAnswers.log('showLeftBox()');
	 $('#stackLayout').addClass('leftShown');
	 $('#leftBox').addClass('leftShown');
  }
}

function hideLeftBox()
{
  if ($('#leftBox').hasClass('leftShown'))
  {
	 MyAnswers.log('hideLeftBox()');
	 $('#stackLayout').removeClass('leftShown');
	 $('#leftBox').removeClass('leftShown');
  }
}

function populateLeftBoxWithMasterCategories()
{
	MyAnswers.log('populateLeftBoxWithMasterCategories()');
	var leftContent = $('#leftContent');
	var alreadyDone = $('#leftLabel').html() == 'Master Categories';
	if (alreadyDone)
	{
		leftContent.find('.selected').removeClass('selected');
		var selected = $('#leftmaster' + currentMasterCategory);
		selected.addClass('selected');
	}
	else
	{
		var order = siteConfig.master_categories_order;
		var list = siteConfig.master_categories;
		if (siteConfig.sidebar_config === 'textonly')
		{
			leftContent.empty();
			var html = "<ul>"
			for (id in order)
			{
				html += "<a onclick=\"showCategoriesView('" + order[id] + "')\">";
				html += "<li id='leftmaster" + order[id] + "'>" + list[order[id]].name + "</li>";
				html += "</a>";
			}
			html += "</ul>";
			leftContent.append(html);
		}
		else
		{
			hideLeftBoxContents(function() {
				leftContent.hide();
				var html = "";
				for (id in order)
				{
					html += "<a onclick=\"showCategoriesView('" + order[id] + "')\">";
					html += "<img src=\"" + list[order[id]].image + "\" alt=\"" + list[order[id]].name + "\" id=\"leftmaster" + order[id] + "\" />";
					html += "</a>";
				}
				leftContent.append(html);
				leftContent.find('img').removeAttr('style');
				showLeftBoxContents();
			});
		}
		leftContent.find('.selected').removeClass('selected');
		$('#leftmaster' + currentMasterCategory).addClass('selected');
	}
	$('#leftLabel').html('Master Categories');
}

function populateLeftBoxWithCategories(masterCategory)
{
	MyAnswers.log('populateLeftBoxWithCategories()');
	var leftContent = $('#leftContent');
	var alreadyDone = $('#leftLabel').html() == (hasMasterCategories ? siteConfig.master_categories[masterCategory].name : 'Categories');
	if (alreadyDone)
	{
		leftContent.find('.selected').removeClass('selected');
		var selected = $('#leftcategory' + currentCategory);
		selected.addClass('selected');
	}
	else
	{
		if (siteConfig.sidebar_config === 'textonly')
		{
			populateTextOnlyCategories(masterCategory);
		}
		else
		{
			hideLeftBoxContents(function() {
				leftContent.hide();
				var order = hasMasterCategories ? siteConfig.master_categories[masterCategory].categories : siteConfig.categories_order;
				var list = siteConfig.categories;
				var html = "";
				for (id in order)
				{
					html += "<a onclick=\"showKeywordListView('" + order[id] + "')\">";
					html += "<img src=\"" + list[order[id]].image + "\" alt=\"" + list[order[id]].name + "\" id=\"leftcategory" + order[id] + "\" />";
					html += "</a>";
				}
				leftContent.append(html);
				leftContent.find('img').removeAttr('style');
				showLeftBoxContents();
			});
		}
		leftContent.find('.selected').removeClass('selected');
		$('#leftcategory' + currentCategory).addClass('selected');
	}
	$('#leftLabel').html(hasMasterCategories ? siteConfig.master_categories[masterCategory].name : 'Categories');
}

function hideLeftBoxContents(callback)
{
	var contents = $('#leftContent img');
	contents.addClass('animating');
	contents.addClass('hidden');
	setTimeout(function() {
		$('#leftContent').empty();
		callback();
	}, 0.2 * 1000);
}

function showLeftBoxContents(callback)
{
	var images = $('#leftContent img');
	var leftContent = $('#leftContent');
	images.addClass('hidden');
	leftContent.show();
	images.addClass('animating');
	images.show();
	images.removeClass('hidden');
	setTimeout(function() {
		images.removeClass('animating');
	}, 0.2 * 1000);
}

function onScroll(event) {}

(function() {
  var timer = setInterval(function() {
		if (typeof(MyAnswers.device_Loaded) != 'undefined') {
			try {
				MyAnswers.device_Loaded = true;
				clearInterval(timer);
			} catch(e) {
				MyAnswers.log("***** Unable to set: MyAnswers.device_Loaded => true");
			}
		}
  }, 100);
})();
