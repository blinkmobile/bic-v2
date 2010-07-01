var keywords = ["Loading..."];
var descriptions = ["Please wait..."];
var keywordAttributes = null;
var helpText = null;
var keywordArgumentsHtml = null;
var categories = null;
var currentCategory = "";
var currentKeywordNumber = 0;
var httpCategoriesRequest = false;
var httpAnswerRequest = false;
var httpBlingRequest = false;
var disconnectedDataStore = new Array();
var row1;
var row2;
var answerSpaceCategories = true;
var answerSpaceOneKeyword = false;

var answerSpaceVisualCategories = false;
var defaultCategoryIndex;

var webappCache = window.applicationCache;


if (localStorage.getItem("_answerSpace") != answerSpace) {
  console.log("answerSpace(1) changed - clearing local storage");
  //alert("answerSpace(1) changed - clearing local storage");
  localStorage.clear();
}
if (!answerSpace || answerSpace == "<?=$_REQUEST['answerSpace']?>")
{
   answerSpace = 'blink';
   localStorage.setItem("_answerSpace", answerSpace);
} 
console.log("main(1): ");

window.removeEventListener("load", dashcode.setupParts, false);
console.log("main(2): ");
//window.addEventListener("load", loaded, false);
webappCache.addEventListener("updateready", updateCache, false);
webappCache.addEventListener("error", errorCache, false);

try {
    if (!window.openDatabase) {
        alert('Unable to create disconnected mode databases');
    } else {
        //var shortName = 'mydatabase';
        var version = '1.0';
        var displayName = 'myAnswers AnswerSpace: ' + answerSpace;
        var maxSize = 65536; // in bytes
        var db = openDatabase(answerSpace, version, displayName, maxSize);
 
        // You should have a database instance in db.
	// Create the required tables if the don't exist
	db.transaction(
	   function (transaction) {
	   /* Creat table to hold persistent data for Answer Space accesses. */
	   transaction.executeSql('CREATE TABLE IF NOT EXISTS answerSpaceData(id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, answerParm TEXT UNIQUE ON CONFLICT REPLACE NOT NULL, answerParmValue TEXT NOT NULL);', 
				  [], 
				  function (transaction, results) {
				  }, 
				  function (transaction, error) {
				    alert('Database transaction error(1):  ' + error.message + ' (Code ' + error.code +')');
				    return true;
				  }
				  );
	   });

    }
} catch(e) {
    // Error handling code goes here.
    if (e == 2) {
        // Version number mismatch.
        alert("Invalid myAnswers database version.");
    } else {
        alert("Unknown error " + e + ".");
    }
    return;
}
//
// Reload disconnected mode data store from database
//
db.transaction(
	       function (transaction) {
		 transaction.executeSql("SELECT answerparm, answerParmValue FROM answerSpaceData;",
					[],
					function (transaction, resultSet) {
					  var i;
					  if (resultSet.rows.length > 0) {
					    for (i = 0; i < resultSet.rows.length; i++) {
					      disconnectedDataStore[resultSet.rows.item(i)['answerParm']] = resultSet.rows.item(i)['answerParmValue']; 
					    }
					    return true;
					  } else {
					    return false;
					  }
					}, 
					function (transaction, error) {
					  alert('Database transaction error(3):  ' + error.message + ' (Code ' + error.code +')');
					  return false;
					}
					);
	       });

dumpLocalStorage();

function setAnswerSpaceItem(key, value) {
  console.log("setAnswerSpaceItem key = " + key);
  disconnectedDataStore[key] = value;
  //
  // Persist data across application restarts
  //
  db.transaction(
     function (transaction) {
       transaction.executeSql('INSERT INTO answerSpaceData (answerParm, answerParmValue) VALUES ( ?, ? );',
			      [key, value],
			      function (transaction, resultSet) {
				if (!resultSet.rowsAffected) {
				  alert("REPLACE no rows affected");
				}
			      }, 
			      function (transaction, error) {
				alert('Database transaction error(2):  ' + error.message + ' (Code ' + error.code +')');
				return true;
			      }
			      );
     });
}

function getAnswerSpaceItem(key) {
  return disconnectedDataStore[key];
}

function removeAnswerSpaceItem(key) {
  db.transaction(
     function (transaction) {
       transaction.executeSql("DELETE FROM answerSpaceData WHERE answerParm = '" + key + "';",
			      [],
			      function (transaction, resultSet) {
				if (!resultSet.rowsAffected) {
				  alert("DELETE no rows affected");
				}
			      }, 
			      function (transaction, error) {
				alert('Database transaction error(2):  ' + error.message + ' (Code ' + error.code +')');
				return true;
			      }
			      );
     });
  delete disconnectedDataStore[key];
}
 
function parseKeywordData() {
  console.log("currentCategory(1): " + currentCategory + " _currentCategory: " + getAnswerSpaceItem("_currentCategory"));
  if (!getAnswerSpaceItem(currentCategory + "_rawKeywordData"))
    return;
  //var keywordDataArray = getAnswerSpaceItem(currentCategory + "_rawKeywordData").split("|||");
    var keywordDataArray = getAnswerSpaceItem(currentCategory + "_rawKeywordData").split("&");
  
  console.log("-: " + getAnswerSpaceItem(currentCategory + "_rawKeywordData"));
  answerSpaceOneKeyword = keywordDataArray.length == 2 && !answerSpaceCategories;
  keywords = new Array(keywordDataArray.length - 1);
  descriptions = new Array(keywordDataArray.length - 1);
  helpText = new Array(keywordDataArray.length - 1);
  keywordArgumentsHtml = new Array(keywordDataArray.length - 1);
  for (var i = 1; i < keywordDataArray.length; i++) 
    {
      // keywordAttributes = keywordDataArray[i].split("###");
      keywordAttributes = decodeURIComponent(keywordDataArray[i]).split("&");
      keywords[i-1] = decodeURIComponent(keywordAttributes[0]);
      descriptions[i-1] = decodeURIComponent(keywordAttributes[1]);
      helpText[i-1] = decodeURIComponent(keywordAttributes[2]);
      keywordArgumentsHtml[i-1] = decodeURIComponent(keywordAttributes[3]);
    }
}

// This object implements the dataSource methods for the keyword list.
var keywordController = {
	
	// Sample data for the content of the list. 
	// Your application may also fetch this data remotely via XMLHttpRequest.
	_rowData: keywords,
    
    setRowData: function() {
       if (!navigator.onLine) {
	 console.log("Network not connected(1)...");
	 //alert("Network not connected(1)...");
	 //return;
       }
       var httpRequest = new XMLHttpRequest();
       var timer = null;
       var requestActive = false;
       var url = "../iPhoneUtil/GetKeywords.php?answerSpace=" + localStorage.getItem("_answerSpace");

       console.log("currentCategory(3): " + currentCategory  + " _currentCategory: " + getAnswerSpaceItem("_currentCategory"));
       currentCategory = getAnswerSpaceItem("_currentCategory");
       if (currentCategory)
       {
         url += "&category=" + encodeURIComponent(currentCategory);
       }

       httpRequest.onreadystatechange = function(evt) {
          /* readyState 4 indicates the transaction is complete; status 200 indicates "OK" */ 
	  console.log("currentCategory(3a): evt = " + evt + "; readyState = " + httpRequest.readyState);
          if (httpRequest.readyState == 4) 
          {
	    console.log("currentCategory(3b): evt = " + evt + "; readyState = " + httpRequest.readyState + "; status = " + httpRequest.status);
	    clearTimeout(timer);
	    requestActive = false;
	    console.log("Clearing timer(0): " + timer);

	    if (httpRequest.status == 200)
            {
                var rawKeywordData =  httpRequest.responseText;

		if (rawKeywordData && rawKeywordData != "ERROR") 
                {
		  console.log("currentCategory(2): " + currentCategory  + " _currentCategory: " + getAnswerSpaceItem("_currentCategory"));
		  currentCategory = getAnswerSpaceItem("_currentCategory");
		  setAnswerSpaceItem(currentCategory + "_rawKeywordData", rawKeywordData);
		  parseKeywordData();
		  window.scrollTo(0, 1);
                }
                else
                {
                   //alert("Request for keywords failed.");
                   keywords = [];
                   descriptions = ["No available keywords in this category"];
                }
                keywordController._rowData = keywords;

            }
            else
            {
	       console.log("Http status <> 200");
	       keywords = ["Network Unreachable"];
	       descriptions = ["Please retry when you are in network coverage"];
	       parseKeywordData();
	       keywordController._rowData = keywords;
	       console.log("currentCategory(2a): ");
	       dashcode.setupParts();
	       console.log("currentCategory(2b): ");
            }
	    setTimeout(function() {
		console.log("reloadData(1): ");
		if (answerSpaceOneKeyword) {
		  showKeywordView(0);
		} else {
		  document.getElementById('list').object.reloadData();
		}
		document.getElementById('startUp').style.display = 'none';
		document.getElementById('content').style.display = 'block';
		setTimeout(function() {
		    window.scrollTo(0, 1);
		  }, 1000);
	      }, 1000);
          }
       };
       console.log("httpRequest.open(): Before");
       httpRequest.open('GET', url, true);
       console.log("httpRequest.open(): After");
       httpRequest.setRequestHeader("Cache-Control", "no-cache");
       console.log("httpRequest.setRequestHeader(): After");
       requestActive = true;
       httpRequest.send();
       console.log("Setting timer: " + timer);
       timer = setTimeout(function() {
	   console.log("timeout(1): Before - " + timer);
	   httpRequest.abort();
	   console.log("timeout(1): After");
	   if (requestActive) {
	     requestActive = false;
	     console.log("Displaying local copy of data"); 

	     keywords = ["Network Unreachable"];
	     descriptions = ["Please retry when you are in network coverage"];
	     parseKeywordData(); 
	     keywordController._rowData = keywords;
	     console.log("Timeout(1a): ");
	     dashcode.setupParts();
	     console.log("Timeout(1b): ");
	     document.getElementById('list').object.reloadData();
	     document.getElementById('startUp').style.display = 'none';
	     document.getElementById('content').style.display = 'block';
	   }
	 },
	 5000) ;

       console.log("httpRequest.send(): After");
    },
	
	// The List calls this method to find out how many rows should be in the list.
	numberOfRows: function() {
		return this._rowData.length;
	},
	
	// The List calls this method once for every row.
	prepareRow: function(rowElement, rowIndex, templateElements) {
		// templateElements contains references to all elements that have an id in the template row.
		// Ex: set the value of an element with id="keywordLabel".
 		if (templateElements.keywordLabel) {
		  templateElements.keywordLabel.innerHTML = this._rowData[rowIndex];
		  templateElements.keywordDescription.innerHTML = descriptions[rowIndex];
		  rowElement.style.backgroundColor = rowIndex % 2 ? row2 : row1;
		}
		
		// Assign a click event handler for the row.
		rowElement.onclick = function(event) {
		  console.log("prepareRow(6): ");
		  currentKeywordNumber = rowIndex;
		  console.log("prepareRow(7): ");
		  gotoNextScreen(rowIndex);
		  console.log("prepareRow(8): ");
		};
	}
};

function updateCache()
{
  console.log("updateCache: " + webappCache.status);
  if (webappCache.status != window.applicationCache.IDLE) {
    webappCache.swapCache();
    console.log("Cache has been updated due to a change found in the manifest");
  } else {
    webappCache.update();
    console.log("Cache update requested");
  }
}
function errorCache()
{
  console.log("errorCache: " + webappCache.status);
  console.log("You're either offline or something has gone horribly wrong.");
}

function parseOptions(options) {
  var result = "list";
  if (options != "ERROR")
    {
      if (options != "NO_CATEGORIES")
	{
	  var optionsComponents = options.split("&");
	  answerSpaceCategories = true;
	  console.log("GetCategories(1b): " + options); 
	  console.log("GetCategories(1ba): " + optionsComponents[0]); 
	  console.log("GetCategories(1bb): " + optionsComponents[1]); 
	  switch (optionsComponents[0]) {
	  case "listview":
	    document.getElementById("categoriesMenu").innerHTML = decodeURIComponent(optionsComponents[1]);
	    document.getElementById("navBox0").style.visibility = 'hidden';
			defaultCategoryIndex = categoriesMenu.selectedIndex;
	 	  answerSpaceCategories = true;
	    break;

	  case "visualview":
	    console.log("GetCategories(1c): " + options); 
	    document.getElementById("columnLayout1").style.display = 'none';
	    document.getElementById("categoriesBox").style.display = 'none';
	    document.getElementById("categoriesBox").style.visibility = 'hidden';
	    document.getElementById("categoryVisualDisplay").innerHTML = decodeURIComponent(optionsComponents[1]);
	    document.getElementById("categoryVisualDisplay").style.display = 'block';
	    answerSpaceCategories = true;
			answerSpaceVisualCategories = true;
	    result = "visual";
	    break;

	  default:
	    options = '<option class="apple-hidden" value="Error">Error</option>';
	    console.log("GetCategories(1ddd): " + options); 
	    document.getElementById("categoriesMenu").innerHTML = decodeURIComponent(optionsComponents[1]);
	    answerSpaceCategories = false;
	    result = "list";
	    break;
	  }
	}
      else
	{
	  console.log("GetCategories(1c): " + options); 
	  document.getElementById("columnLayout1").style.display = 'none';
	  document.getElementById("categoriesBox").style.display = 'none';
	  answerSpaceCategories = false;
	}
    }
  else
    {
      options = '<option class="apple-hidden" value="Error">Error</option>';
      console.log("GetCategories(1d): " + options); 
      document.getElementById("categoriesMenu").innerHTML = options;
    }
  return result;
}
 
// Function: loaded()
// Called by Window's load event when the web application is ready to start
//
function loaded(row1String, row2String)
//function loaded()
{
    var timer = null;
    var requestActive = false;
    row1 = row1String;
    row2 = row2String;

    console.log("loaded(1): ");
    //document.getElementById('startUp').style.display = 'none';
    //document.getElementById('content').style.display = 'block';
 
    switch(webappCache.status)
      {
      case 0:
	console.log("Cache status: Uncached");
	break;
      case 1:
	console.log("Cache status: Idle");
	break;
      case 2:
	console.log("Cache status: Checking");
	break;
      case 3:
	console.log("Cache status: Downloading");
	break;
      case 4:
	console.log("Cache status: Updateready");
	break;
      case 5:
	console.log("Cache status: Obsolete");
	break;
      }

    
    console.log("loaded(4a): ");
    if (!navigator.onLine) {
      //alert("Network not connected(2)...");
      console.log("Network not connected(2)...");
      //return;
    }
    // Get and set-up the categories
    httpCategoriesRequest = new XMLHttpRequest();
    var url = "../iPhoneUtil/GetCategories.php?answerSpace=" + localStorage.getItem("_answerSpace");

    httpCategoriesRequest.onreadystatechange = function(evt) {
      /* readyState 4 indicates the transaction is complete; status 200 indicates "OK" */
      console.log("httpCategoriesRequest(1): readyState = " + httpCategoriesRequest.readyState);
      if (httpCategoriesRequest.readyState == 4 && (httpCategoriesRequest.status == 200 || httpCategoriesRequest.status == 500)) 
      {
	console.log("httpCategoriesRequest(1): readyState = " + httpCategoriesRequest.readyState + "; status = " + httpCategoriesRequest.status);
	clearTimeout(timer);
	requestActive = false;
        if (httpAnswerRequest.status == 500)
        {
	    document.getElementById("columnLayout1").style.display = 'none';
        }
        else
        {
            var options =  httpCategoriesRequest.responseText;

	    if (parseOptions(options) == "visual") {
	      document.getElementById('startUp').style.display = 'none';
	      document.getElementById('content').style.display = 'block';
	      setAnswerSpaceItem("_currentCategory", "");
	      setAnswerSpaceItem("_options", options);
	      document.getElementById('stackLayout').object.setCurrentView('categoryVisualView', false, true);
	      window.scrollTo(0, 0);
	    } else {
	      if (document.getElementById("columnLayout1").style.display != 'none') { 
		currentCategory = categoriesMenu.options[categoriesMenu.selectedIndex].value;
	      } else {
		currentCategory = "";
	      }
	      setAnswerSpaceItem("_currentCategory", currentCategory);
	      setAnswerSpaceItem("_options", options);
	      console.log("GetCategories(1e): " + currentCategory); 
	      console.log("loaded(5aaa): ");
	      keywordController.setRowData();
	      console.log("loaded(5bbb): ");
	    }
        }
      }
    };
    httpCategoriesRequest.open('GET', url, true); 
    httpCategoriesRequest.setRequestHeader("Cache-Control", "no-cache");
    requestActive = true;
    httpCategoriesRequest.send();
    console.log("Starting timeout(2): " + timer);
    timer = setTimeout(function() {
	console.log("timeout(2): Before - " + timer);
	httpCategoriesRequest.abort();
	console.log("timeout(2): After");
	if (requestActive) {
	  requestActive = false;
	  console.log("Settng category menu"); 
	  if (parseOptions(getAnswerSpaceItem("_options")) == "visual") {
	  } else {
	    console.log("loaded(5aa): ");
	    keywordController.setRowData();
	    console.log("loaded(5bb): ");
	  }
	}
      },
      5000) ;


    dashcode.setupParts();
    if (answerSpaceOneKeyword) {
      showKeywordView(1);
    }
    setTimeout(function() {
	window.scrollTo(0, 1);
      },
      1000);
}

function getAnswer(event)
{
    showAnswerView(currentKeywordNumber);
}

function dumpLocalStorage() {
  var numElements = localStorage.length;
  var i;
  var key;
  for (i = 0; i < numElements; i++) {
    key = localStorage.key(i);
    console.log("dumpLocalStorage: key = " + key + "; value = " + localStorage.getItem(key) + ";");
  }
}

function showCategoryKeywords(selectedCategory) {
  setAnswerSpaceItem("_currentCategory", selectedCategory);
  keywordController.setRowData();

  setSubmitCachedFormButton('pendingFormButton0');
  setSubmitCachedFormButton('pendingFormButton2');
  document.getElementById("navBox0").style.visibility = 'visible';
  document.getElementById("activityIndicator0").style.visibility = 'hidden';
  document.getElementById("navBox0").style.display = 'block';
  document.getElementById("categoriesBox").style.display = 'none';
  document.getElementById('stackLayout').object.setCurrentView('keywordListView', true, true);
  window.scrollTo(0, 1);
}

function showAnswerView(rowIndex)
{
    var timer;

    //document.getElementById('keywordHeading').innerHTML = keywords[rowIndex]; // **** Here1 ****
    //document.getElementById('pendingFormButton2').object.setText("Ok");
    //document.getElementById('pendingFormButton2').object.setEnabled(false);
    //alert("X2: " + document.getElementById('pendingFormButton2').object.getText());
    setSubmitCachedFormButton('pendingFormButton2');
    document.getElementById('innerAnswerBox').innerHTML = "Waiting...";
    var indicatorImage = document.getElementById('activityIndicator2');
    if (indicatorImage.style.visibility == 'hidden')
    {
      indicatorImage.style.visibility = 'visible';
    }
    document.getElementById('activityIndicator0').style.visibility = 'hidden';
    
    // Get and set-up the answer
    httpAnswerRequest = new XMLHttpRequest();
    var url = '../iPhoneUtil/GetAnswer.php?' + createParamsAndArgs(rowIndex);
    //alert(url);
    httpAnswerRequest.onreadystatechange = function(evt) {
      /* readyState 4 indicates the transaction is complete; status 200 indicates "OK" */
      if (httpAnswerRequest.readyState == 4 && (httpAnswerRequest.status == 200 || httpAnswerRequest.status == 500)) 
      {
        var html =  httpAnswerRequest.responseText;
	console.log("Clearing timer(11): " + timer);
	clearTimeout(timer);
	setAnswerSpaceItem(getAnswerSpaceItem("_currentCategory") + "___" + rowIndex, html);

	console.log("showAnswerView(1): " + html);
        document.getElementById('innerAnswerBox').innerHTML = html;
        document.getElementById('activityIndicator2').style.visibility = 'hidden';
	document.getElementById('activityIndicator1').style.visibility = 'hidden';
	document.getElementById('activityIndicator0').style.visibility = 'hidden';
	setSubmitCachedFormButton('pendingFormButton2');
     }
    };
    httpAnswerRequest.open('GET', url, true);
    httpAnswerRequest.send();
    timer = setTimeout(function() {
	var answerItem;

	console.log("timeout(11a): " + timer);
	httpAnswerRequest.abort();
	answerItem = getAnswerSpaceItem(getAnswerSpaceItem("_currentCategory") + "___" + rowIndex);
	console.log("timeout(11b): " + answerItem);
	document.getElementById('innerAnswerBox').innerHTML = answerItem == undefined ? "No result available" : answerItem;
	document.getElementById('activityIndicator2').style.visibility = 'hidden';
	document.getElementById('activityIndicator0').style.visibility = 'hidden';
      },
      30000);
    
    var stackLayout = document.getElementById('stackLayout').object;
    stackLayout.setCurrentView('answerView', false, true);
    window.scrollTo(0, 1);
}



function gotoNextScreen(rowIndex)
{
  if (!keywordArgumentsHtml[rowIndex]) {
    console.log("nextScreen(1): " + rowIndex);
    showAnswerView(rowIndex);
  } else {
    console.log("nextScreen(2): " + rowIndex);
    showKeywordView(rowIndex);
  }
}

function showSecondLevelAnswerView(keyword, arg0)
{
    //alert("X3: " + keyword); // *** Here ****
    //document.getElementById('keywordHeading1').innerHTML = keyword; // *** Here ***
    setSubmitCachedFormButton('pendingFormButton3');
    document.getElementById('innerAnswerBox1').innerHTML = "Waiting...";
    var indicatorImage = document.getElementById('activityIndicator1');
    if (indicatorImage.style.visibility == 'hidden')
    {
        indicatorImage.style.visibility = 'visible';
    }
    
    // Get and set-up the answer
    httpAnswerRequest = new XMLHttpRequest();
    var url = '../iPhoneUtil/GetAnswer.php?answerSpace=' + localStorage.getItem("_answerSpace") + "&keyword=" + keyword + '&args=' + arg0.replace(/&/g, "|^^|s|");

    httpAnswerRequest.onreadystatechange = function(evt) {
      /* readyState 4 indicates the transaction is complete; status 200 indicates "OK" */
      if (httpAnswerRequest.readyState == 4 && (httpAnswerRequest.status == 200 || httpAnswerRequest.status == 500)) 
      {
        var html =  httpAnswerRequest.responseText;
	console.log("showSecondLevelAnswerView(1): " + html);
        document.getElementById('innerAnswerBox1').innerHTML = html;
        document.getElementById('activityIndicator1').style.visibility = 'hidden';
      }
    };
    httpAnswerRequest.open('GET', url, true);
    httpAnswerRequest.send();
    
    var stackLayout = document.getElementById('stackLayout').object;
    stackLayout.setCurrentView('answerView2', false, true);   
    window.scrollTo(0, 1);
}

function showVisualCategoryView()
{
  document.getElementById('stackLayout').object.setCurrentView('categoryVisualView', false, true);
}

function showKeywordView(rowIndex) 
{
    setSubmitCachedFormButton('pendingFormButton0');
    document.getElementById('backButton').style.visibility = answerSpaceOneKeyword ? 'hidden' : 'visible';
    document.getElementById('button').style.visibility = helpText[rowIndex] ? 'visible' : 'hidden';
    document.getElementById('activityIndicator0').style.visibility = 'hidden';
    document.getElementById('activityIndicator1').style.visibility = 'hidden';
    document.getElementById('activityIndicator2').style.visibility = 'hidden';
    //document.getElementById('keywordHeading2').innerHTML = keywords[rowIndex]; //***** Here ****
    document.getElementById('argsBox').innerHTML = keywordArgumentsHtml[rowIndex];
    if (descriptions[rowIndex]) {
      document.getElementById('descriptionTextBox').innerHTML = descriptions[rowIndex];
      document.getElementById('descriptionBox').style.visibility = 'visible';
    } else {
      document.getElementById('descriptionBox').style.visibility = 'hidden';
    }
    var stackLayout = document.getElementById('stackLayout').object;
    stackLayout.setCurrentView('keywordView', false, true);
    window.scrollTo(0, 1);
}

function goBackToKeywordListView(event)
{
    //document.getElementById('list').object.setSelectionIndexes(new Array(keywords.length), true);
    if (answerSpaceOneKeyword) {
      showKeywordView(0);
      return;
    }
    var stackLayout = document.getElementById('stackLayout').object;
    setSubmitCachedFormButton('pendingFormButton0');
    setSubmitCachedFormButton('pendingFormButton2');
    stackLayout.setCurrentView('keywordListView', true, true);
    window.scrollTo(0, 1);
}

function createParamsAndArgs(rowIndex)
{
	// rewritten by Ron to "walk the DOM"
   var returnValue = "answerSpace=" + localStorage.getItem("_answerSpace") + "&keyword=" + keywords[rowIndex];
   var args = "";

	argElements = document.getElementById("argsBox").getElementsByTagName("input");
   for (var i = 0; i < argElements.length; i++) {
			if(argElements[i].type && (argElements[i].type.toLowerCase()=="radio" || argElements[i].type.toLowerCase()=="checkbox") && argElements[i].checked==false) {
				 // do nothing for unchecked radio or checkbox
			}else if(argElements[i].name){
				// name is of the form "args[" + number + "]"
				args += "&" + argElements[i].name + "=" + (argElements[i].value ? encodeURIComponent(argElements[i].value) : "");
      }
   }
	argElements = document.getElementById("argsBox").getElementsByTagName("textarea");
   for (var i = 0; i < argElements.length; i++) {
			if(argElements[i].name){
				// name is of the form "args[" + number + "]"
				args += "&" + argElements[i].name + "=" + (argElements[i].value ? encodeURIComponent(argElements[i].value) : "");
      }
   }
	argElements = document.getElementById("argsBox").getElementsByTagName("select");
   for (var i = 0; i < argElements.length; i++) {
			if(argElements[i].name){
				// name is of the form "args[" + number + "]"
				args += "&" + argElements[i].name + "=" + (argElements[i].value ? encodeURIComponent(argElements[i].value) : "");
      }
   }

	 if (args)
    {
       returnValue += encodeURI(args);
    } else {
     var oneArgElement = document.getElementById("arg1");
     if (oneArgElement) {
       returnValue += "&" + encodeURI("args=" + oneArgElement.value);
     }
    }
    return returnValue;
}


function showHelpView(event)
{
    document.getElementById('keywordHeading3').innerHTML = keywords[currentKeywordNumber]; //**** Here ****
    
    var helpContents = helpText[currentKeywordNumber] ? helpText[currentKeywordNumber] : "Sorry, no help is available.";
    
    document.getElementById('helpBox').innerHTML = helpContents;
    
    var stackLayout = document.getElementById('stackLayout').object;
    stackLayout.setCurrentView('helpView', false, true); 
    window.scrollTo(0, 1);
}

function showLoginView(event)
{
    document.getElementById('keywordHeading4').innerHTML = "Login";
   
    httpBlingRequest = new XMLHttpRequest();
    url = "../login/index_iphone.php";

    httpBlingRequest.onreadystatechange = function(evt) {
      /* readyState 4 indicates the transaction is complete; status 200 indicates "OK" */
      if (httpBlingRequest.readyState == 4 && (httpBlingRequest.status == 200 || httpBlingRequest.status == 500)) 
      {
        if (httpBlingRequest.status == 500)
        {
            alert("Error getting bling." + httpBlingRequest.responseText);
        }
        else
        {
            //var blingData =  httpBlingRequest.responseText;
            
            var helpContents = httpBlingRequest.responseText;
            
            document.getElementById('loginBox').innerHTML = helpContents;
            
            var stackLayout = document.getElementById('stackLayout').object;
            stackLayout.setCurrentView('loginView', false, true); 
	    window.scrollTo(0, 1);
        }
      }
    };
    //****
    // Todo: Timout GET in case network goes away and display appropriate alert box
    //****
    httpBlingRequest.open('GET', url, true);
    httpBlingRequest.setRequestHeader("Cache-Control", "no-cache");
    httpBlingRequest.send();
}
function updateLoginBar(){

    httpLoginBarRequest = new XMLHttpRequest();
    var url = "../iPhoneUtil/GetLogin.php";

    httpLoginBarRequest.onreadystatechange = function(evt) {
      /* readyState 4 indicates the transaction is complete; status 200 indicates "OK" */
      if (httpLoginBarRequest.readyState == 4 && (httpLoginBarRequest.status == 200 || httpLoginBarRequest.status == 500)) 
      {
        if (httpLoginBarRequest.status == 500)
        {
            alert("Error getting bling." + httpLoginBarRequest.responseText);
        }
        else
        {
            //var blingData =  httpBlingRequest.responseText;
            document.getElementById('loginBar').innerHTML = httpLoginBarRequest.responseText;
        }
      }
    };
    httpLoginBarRequest.open('GET', url, true);
    httpLoginBarRequest.setRequestHeader("Cache-Control", "no-cache");
    httpLoginBarRequest.send();   
   
}

function submitLogin()
{
    //alert(document.getElementById('mobile_number').value + document.getElementById('password').value);
    
    httpBlingRequest = new XMLHttpRequest();
    var url = "../login/index_iphone.php?action=login&mobile_number=" + document.getElementById('mobile_number').value + "&password=" + document.getElementById('password').value;
 
    httpBlingRequest.onreadystatechange = function(evt) {
      /* readyState 4 indicates the transaction is complete; status 200 indicates "OK" */
      if (httpBlingRequest.readyState == 4 && (httpBlingRequest.status == 200 || httpBlingRequest.status == 500)) 
      {
        if (httpBlingRequest.status == 500)
        {
            alert("Error getting bling." + httpBlingRequest.responseText);
        }
        else
        {
            //var blingData =  httpBlingRequest.responseText;
            
            var helpContents = httpBlingRequest.responseText;
            if (helpText[currentKeywordNumber])
            {
                helpContents = helpContents;
            }
            
            document.getElementById('loginBox').innerHTML = helpContents;
            
            var stackLayout = document.getElementById('stackLayout').object;
            stackLayout.setCurrentView('loginView', false, true); 
        }
      }
      updateLoginBar();
      refreshKeywords();
    };

    httpBlingRequest.open('GET', url, true);
    httpBlingRequest.setRequestHeader("Cache-Control", "no-cache");
    httpBlingRequest.send();
}

function submitLogout()
{
    //alert(document.getElementById('mobile_number').value + document.getElementById('password').value);
    
    httpBlingRequest = new XMLHttpRequest();
    var url = "../login/index_iphone.php?action=logout";

    httpBlingRequest.onreadystatechange = function(evt) {
      /* readyState 4 indicates the transaction is complete; status 200 indicates "OK" */
      if (httpBlingRequest.readyState == 4 && (httpBlingRequest.status == 200 || httpBlingRequest.status == 500)) 
      {
        if (httpBlingRequest.status == 500)
        {
            alert("Error getting bling." + httpBlingRequest.responseText);
        }
        else
        {
            //var blingData =  httpBlingRequest.responseText;
            
            var helpContents = httpBlingRequest.responseText;
            if (helpText[currentKeywordNumber])
            {
                helpContents = helpContents;
            }
            
            document.getElementById('loginBox').innerHTML = helpContents;
            
            var stackLayout = document.getElementById('stackLayout').object;
            stackLayout.setCurrentView('loginView', false, true); 
	    window.scrollTo(0, 1);
        }
      }
      updateLoginBar();
      refreshKeywords();
    };
    httpBlingRequest.open('GET', url, true);
    httpBlingRequest.setRequestHeader("Cache-Control", "no-cache");
    httpBlingRequest.send();
}


function refreshKeywords(event)
{
    console.log("currentCategory(4): " + currentCategory);
    currentCategory = categoriesMenu.options[categoriesMenu.selectedIndex].value;
    setAnswerSpaceItem("_currentCategory", currentCategory);
    console.log("currentCategory(5): " + currentCategory);
    keywordController.setRowData();

    console.log("currentCategory(6): " + currentCategory);

}

function goBackToHome() {
	 if (answerSpaceVisualCategories)
	 {
			document.getElementById('stackLayout').object.setCurrentView('categoryVisualView', true, true);
	 }
	 else
	 {
			currentCategory = defaultCategoryIndex ? categoriesMenu.options[defaultCategoryIndex].value : categoriesMenu.options[0].value;
			categoriesMenu.selectedIndex = defaultCategoryIndex;
			setAnswerSpaceItem("_currentCategory", currentCategory);
			console.log("currentCategory(5): " + currentCategory);
			keywordController.setRowData();
			goBackToKeywordListView();
	 }
}

function goBackToTopLevelAnswerView(event)
{
    var stackLayout = document.getElementById('stackLayout').object;
    stackLayout.setCurrentView('answerView', true, true);
    window.scrollTo(0, 1);
}

var newKeyword = "";
function passLocation(keyword) {
   // Get location no more than 10 minutes old. 600000 ms = 10 minutes.
   newKeyword = keyword;
   //alert("hi");
   navigator.geolocation.getCurrentPosition(showLocation, showError, {enableHighAccuracy:true,maximumAge:600000});
}

function showError(error) {
   alert(error.code + ' ' + error.message);
}

function showLocation(position) {
   showSecondLevelAnswerView(newKeyword, position.coords.latitude + ',' + position.coords.longitude);
}

function showLocationX(position) {
   alert('<p>Latitude: ' + position.coords.latitude + '</p>' 
   + '<p>Longitude: ' + position.coords.longitude + '</p>' 
   + '<p>Accuracy: ' + position.coords.accuracy + '</p>' 
   + '<p>Altitude: ' + position.coords.altitude + '</p>' 
   + '<p>Altitude accuracy: ' + position.coords.altitudeAccuracy + '</p>' 
   + '<p>Speed: ' + position.coords.speed + '</p>' 
   + '<p>Heading: ' + position.coords.heading + '</p>');
}

function submitForm() {
   //alert('HI!');
   
   /*
    document.getElementById('keywordHeading').innerHTML = keywords[rowIndex];
    document.getElementById('innerAnswerBox').innerHTML = "Waiting...";
    var indicatorImage = document.getElementById('activityIndicator2');
    if (indicatorImage.style.visibility == 'hidden')
    {
        indicatorImage.style.visibility = 'visible';
    }
   */
   document.getElementById('activityIndicator2').style.visibility = 'visible';
   document.getElementById('activityIndicator1').style.visibility = 'visible';
   document.getElementById('activityIndicator0').style.visibility = 'visible';
   var str = '';
   for (i in document.forms[0].elements) {
      var thisElement = document.forms[0].elements[i];
      if(thisElement.name){
       
       //alert(document.forms[0].elements[i].type.toLowerCase());
         if(thisElement.type && (thisElement.type.toLowerCase()=="radio" || thisElement.type.toLowerCase()=="checkbox") && thisElement.checked==false) {
            // do nothing for unchecked radio or checkbox
         }
        else {
           str += "&" + thisElement.name + "=" + thisElement.value;
        }
      
      }
        
   }
   str = str.substring(1);
   console.log("submitForm(2): " + document.forms[0].action);
   queuePendingFormData(str, document.forms[0].action, document.forms[0].method.toLowerCase(), Math.uuid());
   window.scrollTo(0, 1);
   submitFormWithRetry();
}

function queuePendingFormData(str, arrayAsString, method, uuid) {
  if (getAnswerSpaceItem("_pendingFormDataString")) {
    setAnswerSpaceItem("_pendingFormDataString", getAnswerSpaceItem("_pendingFormDataString") + ":" + encodeURIComponent(str));
    setAnswerSpaceItem("_pendingFormDataArrayAsString", getAnswerSpaceItem("_pendingFormDataArrayAsString") + ":" + encodeURIComponent(arrayAsString));
    setAnswerSpaceItem("_pendingFormMethod", getAnswerSpaceItem("_pendingFormMethod") + ":" + encodeURIComponent(method));
    setAnswerSpaceItem("_pendingFormUUID", getAnswerSpaceItem("_pendingFormUUID") + ":" + encodeURIComponent(uuid));
  } else {
    setAnswerSpaceItem("_pendingFormDataString", encodeURIComponent(str));
    setAnswerSpaceItem("_pendingFormDataArrayAsString", encodeURIComponent(arrayAsString));
    setAnswerSpaceItem("_pendingFormMethod", encodeURIComponent(method));
    setAnswerSpaceItem("_pendingFormUUID", encodeURIComponent(uuid));
  }
}

function headPendingFormData() {
  if (countPendingFormData() == 0) {
    return ["", ""];
  }
  var q1 = getAnswerSpaceItem("_pendingFormDataString").split(":");
  var q2 = getAnswerSpaceItem("_pendingFormDataArrayAsString").split(":");
  var q3 = getAnswerSpaceItem("_pendingFormMethod").split(":");
  var q4 = getAnswerSpaceItem("_pendingFormUUID").split(":");
  console.log("q1[0] => " + q1[0]);
  console.log("q2[0] => " + q2[0]);
  console.log("q3[0] => " + q3[0]);
  console.log("q4[0] => " + q4[0]);
  return [decodeURIComponent(q1[0]), decodeURIComponent(q2[0]), decodeURIComponent(q3[0]), decodeURIComponent(q4[0])];
}

function delHeadPendingFormData() {
  var count;
  if ((count = countPendingFormData()) == 0) {
    console.log("delHeadPendingFormData: count 0, returning");
    return;
  }
  if (count == 1) {
    console.log("*** Emptying Form Queue");
    removeFormRetryData();
    return;
  }
  console.log("_pendingFormDataString => " + getAnswerSpaceItem("_pendingFormDataString"));
  console.log("_pendingFormDataArrayAsString => " + getAnswerSpaceItem("_pendingFormDataArrayAsString"));
  setAnswerSpaceItem("_pendingFormDataString", 
		     getAnswerSpaceItem("_pendingFormDataString").substring(getAnswerSpaceItem("_pendingFormDataString").indexOf(":") + 1));
  setAnswerSpaceItem("_pendingFormDataArrayAsString", 
		     getAnswerSpaceItem("_pendingFormDataArrayAsString").substring(getAnswerSpaceItem("_pendingFormDataArrayAsString").indexOf(":") + 1));
  console.log("_pendingFormDataString => " + getAnswerSpaceItem("_pendingFormDataString"));
  console.log("_pendingFormDataArrayAsString => " + getAnswerSpaceItem("_pendingFormDataArrayAsString"));
}

function countPendingFormData() {
  if (getAnswerSpaceItem("_pendingFormDataString")) {
    var q1 = getAnswerSpaceItem("_pendingFormDataString").split(":");
    console.log("countPendingFormData: q1.length = " + q1.length + ";");
    console.log("countPendingFormData: q1[0] = " + q1[0] + ";");
    console.log("countPendingFormData: q1[1] = " + q1[1] + ";");
    return q1.length;
  } else {
    return 0;
  }
}

function processCachedFormData() {
  if (checkFormRetryData()) {
    if (confirm("Submit pending form data \nfrom previous forms?\nNote: Subsequent forms will continue to pend\nuntil you empty the pending list.")) {
      submitFormWithRetry();
    } else {
      if (confirm("Delete pending form data\nfrom previous forms?")) {
	removeFormRetryData();
      }
    }
  }
}

function setSubmitCachedFormButton(formButton) {
  var queueCount = countPendingFormData();
  if (queueCount != 0) {
    console.log("setSubmitCachedFormButton: Cached items");
    document.getElementById(formButton).object.setText("(" + queueCount + ")");
    document.getElementById(formButton).object.setEnabled(true);
  } else {
    console.log("setSubmitCachedFormButton: NO Cached items");
    document.getElementById(formButton).object.setText("Ok");
    document.getElementById(formButton).object.setEnabled(false);
  }
}

function removeFormRetryData() {
    removeAnswerSpaceItem("_pendingFormDataString");  
    removeAnswerSpaceItem("_pendingFormDataArrayAsString");  
    removeAnswerSpaceItem("_pendingFormMethod");  
    removeAnswerSpaceItem("_pendingFormUUID");  
    setSubmitCachedFormButton('pendingFormButton0');
    setSubmitCachedFormButton('pendingFormButton2');
    setSubmitCachedFormButton('pendingFormButton3');
    console.log("removeFormRetryData: Clearing local storage"); 
}

function checkFormRetryData() {
    console.log("_pendingFormDataString: " + getAnswerSpaceItem("_pendingFormDataString"));
    console.log("_pendingFormDataArrayAsString: " + getAnswerSpaceItem("_pendingFormDataArrayAsString"));
    return (getAnswerSpaceItem("_pendingFormDataString"));
}

function submitFormWithRetry() {    
    var str;
    var arr;
    var method;
    var uuid;
    var timer;
    var localKeyword;

    if (checkFormRetryData()) {
      console.log("submitFormWithRetry(1a): ");
      var qx = headPendingFormData();
      console.log("qx[0] => " + qx[0]);
      console.log("qx[1] => " + qx[1]);
      console.log("qx[2] => " + qx[2]);
      console.log("qx[3] => " + qx[3]);
      str = qx[0];
      arr = qx[1].split("/");
      method = qx[2];
      uuid = qx[3];
    } else {
      console.log("submitFormWithRetry(1b): ");
      return;
    }

    // Get and set-up the answer
    httpAnswerRequest = new XMLHttpRequest();
    var url = '/iPhoneUtil/GetAnswer.php?';
    //alert(url);
    if (arr[0] = "..") {
      url += "answerSpace=" + localStorage.getItem("_answerSpace") + "&keyword=" + arr[1] + "&" + arr[2].substring(1);
      localKeyword = arr[1];
    } else {
      url += "answerSpace=" + arr[1] + "&keyword=" + arr[2];
      localKeyword = arr[2];
    }
    if(method == "get") {
      
      url += "?" + str;
      httpAnswerRequest.open('GET', url, true);      
    } else {
      
      httpAnswerRequest.open('POST', url, true);
      
    }
    console.log("str = " + str);
    //console.log("action = " +  document.forms[0].action);
    console.log("pendingFormDataArrayAsString: " + getAnswerSpaceItem("_pendingFormDataArrayAsString"));
    console.log("arr = " + arr);
    httpAnswerRequest.onreadystatechange = function(evt) {
      /* readyState 4 indicates the transaction is complete; status 200 indicates "OK" */
      if (httpAnswerRequest.readyState == 4 && (httpAnswerRequest.status == 200 || httpAnswerRequest.status == 500)) 
      {
        var html =  httpAnswerRequest.responseText;
	console.log("Clearing timer(10): " + timer);
	clearTimeout(timer);
	timer = null;
	delHeadPendingFormData();

	console.log("html = " + html);
        document.getElementById('innerAnswerBox').innerHTML = html;
        document.getElementById('activityIndicator2').style.visibility = 'hidden';
        document.getElementById('activityIndicator1').style.visibility = 'hidden';
        document.getElementById('activityIndicator0').style.visibility = 'hidden';
	setSubmitCachedFormButton('pendingFormButton2');
         
         var stackLayout = document.getElementById('stackLayout').object;
         stackLayout.setCurrentView('answerView', false, true);
         window.scrollTo(0, 1);
 	 console.log("X1: " + localKeyword);
	//alert("X1: " + localKeyword);
      }
    };
    console.log("Checking method(0):");
    if(method == "get") {
      console.log("Checking method(1a): Before send get");
      httpAnswerRequest.send();
      console.log("Checking method(1b): After send get");      
    }
    else {
      console.log("Checking method(2a): Before send put");     
      httpAnswerRequest.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
      httpAnswerRequest.send(str);
      console.log("Checking method(2b): After send put");           
    }
    document.getElementById('activityIndicator2').style.visibility = 'visible';
    document.getElementById('activityIndicator1').style.visibility = 'visible';
    document.getElementById('activityIndicator0').style.visibility = 'visible';

    console.log("Starting timer (3a): " + timer);
    timer = setTimeout(function() {
	console.log("timout(10a): " + timer);
	timer = null;
	httpAnswerRequest.abort();
	alert("Form data not submitted, retry when you are in coverage");
	goBackToKeywordListView();
      },
      60000);
    console.log("Running timer (3b): " + timer);           

}
