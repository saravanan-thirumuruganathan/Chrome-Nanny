function setupAllDialogs()
{
	setupDialog();
	setupConfirmMessageDialog();
}

function setupDatePickers()
{
	var d = new Date();
	$("#to").val(getDateStr(d));
	d.addDays(-7);
	$("#from").val(getDateStr(d));

	$("#from").datepicker({dateFormat: 'm-d-yy'});
	$("#to").datepicker({dateFormat: 'm-d-yy'});
}

function addBlockSet()
{
	if(!validateBlockSet())
		return false;
	
	var urls = $.trim($("#URLToBeBlocked").val()).split("\n");
	urls = removeElementFromArray(null,urls);
	urls = removeElementFromArray("",urls);

	var timePeriod  = $("#timeToBeBlocked").val();
	timePeriod = convertTimePeriodStrToArray(timePeriod);

	var maxTime = $("#maxTimeADay").val()  || 0;  //assign default value as it is an optional field
	var maxTimeUnit = $("#maxTimeUnit").val() || 24;
	var internalName = $("#blockSetInternalName").val();
	if(internalName ==  null || internalName == "")
		internalName = "BlockSet" + new Date().getTime();

	var blockSetDtls = {
		internalName : internalName,
		name : $("#blockSetName").val(),
		urls : urls,
		interval : timePeriod,
		maxTime : maxTime ,
		maxTimeUnit : maxTimeUnit,
		activeDays : getActiveDays()
	};

	if(!validateIfUrlsAreUnique(blockSetDtls))
	{
		alert('An URL can belong to only one Block Set. Please remove the duplicate URL from this Block Set');
		return false;
	}

	var tags =  getAllLiInUl("#blockListTagsUl")
	storeBlockSet(blockSetDtls,tags);
	clearBlockListBlock();
	populateBlockSets();	
}

function isValidMaxTime(maxTimeADay, maxTimeUnit)
{
       if(!isNumeric(maxTimeADay) || !isNumeric(maxTimeUnit))
                return false;
	var validMin = 0, validMax = 0;

        maxTimeADay = parseFloat(maxTimeADay);
        maxTimeUnit = parseFloat(maxTimeUnit);
	validMax = 60 * maxTimeUnit;

        if(maxTimeADay >= validMin && maxTimeADay <= validMax)
               return true;
	alert('Please enter Max Time between ' + validMin + ' and ' + validMax);
        return false;
}

function validateBlockSet()
{

	//not checking if the url is a valid RFC 1738 as we "can" accept a regexp.
	// 	the problem is that i cannot find a way to "reliably" validate a regexp.
	// 	compiling a bad regexp gives syntax error and not null as output 
	// 	so not doing anything as of now for validating url --sara
	
	if($("#blockSetName").val() == "")
	{
		alert('Please enter the name of the Block Set');
		$("#blockSetName").focus();
		return false;
	}

	var urls = $.trim($("#URLToBeBlocked").val());
	if(urls == "")
	{
		alert('Please enter list of valid URLs to block');
		$("#URLToBeBlocked").focus();
		return false;
	}	
	

	var timeBlock = $("#timeToBeBlocked").val() ;

	if( timeBlock == "")
	{
		alert('Please enter a valid Time to Block ');
		$("#timeToBeBlocked").focus();
		return false;
	}	
	if(!isValidTimeBlock(timeBlock))
	{
		alert('Please a valid time block of the format hhmm-hhmm[,hhmm-hhmm]* ');
		$("#timeToBeBlocked").focus();
		return false;
	}
	
	var maxTimeADay = $("#maxTimeADay").val();
	var maxTimeUnit = $("#maxTimeUnit").val();
	if(maxTimeADay != "") //this is a optional field.
	{
		if(!isValidMaxTime(maxTimeADay, maxTimeUnit))
		{
			$("#maxTimeADay").focus();
			return false;
		}
	}
	
	if($('#blockedURLsBody input:checked').length == 0)
	{
		alert('You cannot slack off all week ! Please select the days on which the URL has to be blocked !');
		return false;
	}

	return true;
}

//shud be split to validation and text later
function getArrayOfWeekDayElems()
{
	var weekDayElems= {0:"#sun", 1:"#mon", 2:"#tue", 3:"#wed", 4:"#thu", 5:"#fri", 6:"#sat"};
	return weekDayElems;
}

function getActiveDays()
{
	var weekDayElems= getArrayOfWeekDayElems(); 
	var isNoDaysSelected = true;
	var index = 0 ;
	var daysSelected = Array();
	
	$.each(weekDayElems,function(k,v){if($(v).is(":checked")) daysSelected.push(k)});
	return daysSelected.join(",");
}

function getFormattedStr(numberToFormat, strInSingle)
{
	var formattedStr = numberToFormat + ' ' ;
	if (numberToFormat == 0 || numberToFormat == 1)
		return formattedStr + strInSingle;
	else
		return formattedStr + strInSingle + 's';
	return '';
}

function getBlockSetStr(blockSetDtls)
{
	var dtlsStr = "<table border=0 nowrap cellspacing ='0' cellpadding='0' class='ModuleSection' align='center' width='95%'>";
	var allTagsForBlockSet = getAllTagsForUrl(blockSetDtls.internalName);

	var editStr =  "&nbsp;&nbsp;<button onclick='javascript:editBlockListedUrl(\"" + blockSetDtls.internalName + "\")';>Edit</button>";
	var deleteStr =  "&nbsp;&nbsp; <button onclick='javascript:removeBlockedUrl(\"" + blockSetDtls.internalName + "\");'>Delete</button>";
	var editDeleteStr = "<span style='float:right;'>" + editStr + deleteStr + "</span>";

	dtlsStr = dtlsStr + "<tr class='tDataGridHeader'><td colspan='2'>" + blockSetDtls.name + editDeleteStr + "</td></tr>";
	dtlsStr = dtlsStr + "<tr class='tDataGridElement'><td>URLs :</td><td>" + blockSetDtls.urls.join(",") + "</td></tr>";
	dtlsStr = dtlsStr + "<tr class='tDataGridElement'><td>Blocked During :</td><td>" + convertTimePeriodArrToStr(blockSetDtls.interval)+ "</td></tr>";
	dtlsStr = dtlsStr + "<tr class='tDataGridElement'><td>Max Time :</td><td>" + blockSetDtls.maxTime+ " minutes every " + getFormattedStr(blockSetDtls.maxTimeUnit, 'hour')  + "</td></tr>";
	dtlsStr = dtlsStr + "<tr class='tDataGridElement'><td>Apply On Days :</td><td>" + convertDayNumToDayStr(blockSetDtls.activeDays)+ "</td></tr>";
	dtlsStr = dtlsStr + "<tr class='tDataGridElement'><td>Tags:</td><td>" + allTagsForBlockSet.join(",") + "</td></tr>";
	dtlsStr += "</table>";

	return dtlsStr;
}

function callConfirm(message,operation, operand)
{
	$("#confirmMessage").html(message);
	$("#operationToPerform").val(operation);
	$("#operandVal").val(operand);
	confirmMsgDialogObj.show();
	confirmMsgDialogObj.dialog("open");
}

function handleDeleteBlockSet(blockSetName)
{
/*	if(!confirm('Are you sure you want to delete this Block Set ?'))
		return;
	deleteBlockSet(blockSetName);
	populateBlockSets();
*/
	callConfirm("Are you sure you want to delete this block set ?",'B',blockSetName);
}

function removeBlockedUrl(blockSetName)
{
	if(blockSetName == null) return;
	if(isBlockSetLockedDown(blockSetName))
	{
		alert('A lockdown is active for this blockset. It can be modified/removed only after it is over');
		return ;
	}

	if(chrome.extension.getBackgroundPage().BackGroundManager.checkIfBlockSetShudBeBlockedNOW(blockSetName))
		challengeUser(blockSetName,'D');
	else
		handleDeleteBlockSet(blockSetName);
}

function populateBlockListFields(blockSetDtls,allTags)
{
	$("#blockSetInternalName").val(blockSetDtls.internalName);
	$("#blockSetName").val(blockSetDtls.name);
	$("#URLToBeBlocked").val(blockSetDtls.urls.join("\n"));
	$("#timeToBeBlocked").val(convertTimePeriodArrToStr(blockSetDtls.interval));
	$("#maxTimeADay").val(blockSetDtls.maxTime);
	$("#maxTimeUnit").val(blockSetDtls.maxTimeUnit);

	var weekDayElems = getArrayOfWeekDayElems();
	$.each(weekDayElems, function(key,elem){$(elem).attr('checked',false);});
	$.each(blockSetDtls.activeDays.split(","), function(key,val) {$(weekDayElems[val]).attr('checked',true); } );

	addTagsToUl("#blockListTagsUl",allTags);
}

function handleEditBlockSet(blockSetName)
{
	$("#dialogBlockSet").val("");
	$("#editOrDeleteBlockSet").val("");
	var blockSetDtls = getBlockSetDtls(blockSetName);
	var allTags = getAllTagsForUrl(blockSetName);
	populateBlockListFields(blockSetDtls,allTags);
}

function editBlockListedUrl(blockSetName)
{
	if(blockSetName == null) return;
	if(isBlockSetLockedDown(blockSetName))
	{
		alert('A lockdown is active for this blockset. It can be modified/removed only after it is over');
		return ;
	}
	
	if(chrome.extension.getBackgroundPage().BackGroundManager.checkIfBlockSetShudBeBlockedNOW(blockSetName))
		challengeUser(blockSetName,'E');
	else
		handleEditBlockSet(blockSetName);
}

function sortBlockSetsBasedOnName(blockSetNameA,blockSetNameB)
{
	var aDtls = getBlockSetDtls(blockSetNameA); 
	var bDtls = getBlockSetDtls(blockSetNameB); 
	var aName = aDtls.name.toUpperCase(); 
	var bName = bDtls.name.toUpperCase();; 
	if(aName < bName) return -1; 
	if(aName > bName) return 1; 
	return 0;
}

function populateBlockSets()
{
	var allBlockedUrls = getAllBlockedUrls();
	var allBlockedUrlDtls = getAllBlockedUrlDtls();

	var allBlockSets = getAllBlockSets();
	var dtlsStr = "",blockSetDtls = {}, url = "";

	chrome.extension.getBackgroundPage().BackGroundManager.setBlockList(allBlockedUrls,allBlockedUrlDtls);
	allBlockSets = allBlockSets.sort(sortBlockSetsBasedOnName);

	$("#allBlockSetsTbl").find("tr:gt(0)").remove();
	$("#allBlockSetsTbl").append("<tr class='tDataGridElement'><td>&nbsp;&nbsp;<p/></td></tr>");

	$.each(allBlockSets, function(key, blockSetName){
		blockSetDtls = getBlockSetDtls(blockSetName);
		dtlsStr = getBlockSetStr(blockSetDtls);
		$("#allBlockSetsTbl").append("<tr class='tDataGridElement'><td>" + dtlsStr + "<p/></td></tr>");
	});
	updateBlockSetsInOtherTabs();
}

function updateBlockSetsInOtherTabs()
{
	populateLockDown();
}

function clearBlockListBlock()
{
	$("#blockSetInternalName").val("");
	$("#blockSetName").val("");
	$('#URLToBeBlocked').val("");
	$('#timeToBeBlocked').val("");
	$('#maxTimeADay').val("");
	$('#blockListTagsUl').html("");
	//check all the checkboxes
	$('#blockedURLsBody input:checkbox').each(function(){this.checked = true;});
}

function clearBlockListUrlTags()
{
	$('#blockListTagsUl').html("");
}

function addTagToBlockListDiv()
{
	var tagName = $('#blockListAllTags').val();	
	if(tagName == null)
	{
		alert('Please retry after adding new tags in the Tags tab');
		return;
	}
	if(checkIfTagPresentInList('#blockListTagsUl',tagName))
		return;
	appendItemToUl('#blockListTagsUl', tagName);
}

function addTag()
{
	var tagName = $("#tagName").val() ;
	if(tagName == "")
	{
		alert("Please add some valid tag name !");
		return;
	}
	storeTag(tagName);
	$("#tagName").val("");
	populateTags();
}

function populateTags()
{
	var allTags = getAllTags();
	chrome.extension.getBackgroundPage().BackGroundManager.setTags(allTags);
	$("#allTagsTbl").find("tr:gt(0)").remove();
	for (var index in allTags)
	{
		var tagName = allTags[index];
		dtlsStr = tagName + "&nbsp;&nbsp;<a href='javascript:removeTag(\"" + tagName + "\")';><img src='images/delete.gif'/></a>";
		$("#allTagsTbl").append("<tr><td>" + dtlsStr + "</p></td></tr>");
	}
	updateTagsInOtherTabs(allTags);
}

function removeTag(tagName)
{
	/*
	if(!confirm('Are you sure you want to delete this tag ? '))
		return;
	deleteTag(tagName);
	populateTags();
	*/
	callConfirm("Are you sure you want to delete this tag ?",'T',tagName);
}


function populateWhiteListedUrls()
{
	var allWhiteListedUrls = getAllWhiteListedUrls();
	var url=null,allTagsForUrl = null;
	var tagStr = "", deleteStr = "", editStr = "",dtlsStr = "";

	chrome.extension.getBackgroundPage().BackGroundManager.setWhiteList(allWhiteListedUrls);
	clearWhiteListBlock();
	$("#allWhiteListedURLsTbl").find("tr:gt(0)").remove();	
	for (var index in allWhiteListedUrls)
	{
		url = allWhiteListedUrls[index];
		allTagsForUrl = getAllTagsForUrl(url);
		if(allTagsForUrl.length > 0)
			tagStr = "&nbsp; &nbsp; Tagged : <i>" + allTagsForUrl.join(",") + "</i>";
		editStr =  "&nbsp;&nbsp;<a href='javascript:editWhiteListedUrl(\"" + url + "\")';><img src='images/edit.gif'/></a>";
		deleteStr = "&nbsp;&nbsp;<a href='javascript:removeWhiteListedUrl(\"" + url + "\")';><img src='images/delete.gif'/></a>";
		dtlsStr = url + tagStr + editStr + deleteStr; 
		$("#allWhiteListedURLsTbl").append("<tr class='tDataGridElement'><td>" + dtlsStr + "<p/></td></tr>");
	}
}

function editWhiteListedUrl(url)
{
	if(url == null)
		return;
	var allTags = getAllTagsForUrl(url);
	$("#whiteListedURL").val(url) ;
	addTagsToUl("#whiteListTagsUl",allTags);
}

function addUrlToWhiteList()
{
	var url = $("#whiteListedURL").val() ;
	var allTagsToUrl = getAllLiInUl("#whiteListTagsUl");
	storeWhiteListedUrl(url,allTagsToUrl);
	clearWhiteListBlock();
	populateWhiteListedUrls();
}


function removeWhiteListedUrl(url)
{
	/*
	if(!confirm('Are you sure you want to delete the url ? '))
		return;
	deleteWhiteListedUrl(url);
	populateWhiteListedUrls();
	*/
	callConfirm("Are you sure you want to delete this url?",'W',url);
}

function clearWhiteListBlock()
{
	$('#whiteListedURL').val("");
	$('#whiteListTagsUl').html("");
}

function clearWhiteListUrlTags()
{
	$('#whiteListTagsUl').html("");
}

function populateGenOptions()
{
	var genOptions = getGeneralOptions();
	$("#remove").attr("checked", genOptions.modeOfBlocking == "remove");
	$("#showblocked").attr("checked", genOptions.modeOfBlocking == "showblocked");
	$("#redirect").attr("checked", genOptions.modeOfBlocking == "redirect");
	$("#redirectUrl").attr("disabled", genOptions.modeOfBlocking != "redirect");
	$("#redirectUrl").val(genOptions.redirectUrl); 
	$("#maxInActiveTimer").val(genOptions.maxInActiveTimer);
	$("#maxMinutesForBlockedUrls").val(genOptions.maxMinutesForBlockedUrls);
	$("#challengeLen").val(genOptions.challengeLen);

	$("#showURLs").attr("checked", genOptions.showBlockedURLs == true);
	$("#doNotShowURLs").attr("checked", genOptions.showBlockedURLs != true);


	if(genOptions.maxMinutesForBlockedUrls > 0)
	{
		var totalTimeSpentTodayInSecs = chrome.extension.getBackgroundPage().BackGroundManager.getTimeUsedForAllBlockedURLs();
		if(totalTimeSpentTodayInSecs >= (genOptions.maxMinutesForBlockedUrls * 60))
			$("#maxMinutesForBlockedUrls").attr('disabled',true);
	}

	$("#redirect").click(function(){$("#redirectUrl").attr('disabled',false);});
	$("#remove").click(function(){ $("#redirectUrl").val(""); $("#redirectUrl").attr('disabled',true);});
	$("#showblocked").click(function(){ $("#redirectUrl").val(""); $("#redirectUrl").attr('disabled',true);});
}

function persistGeneralOptions(challengeLen)
{
	var genOptions = {
                "modeOfBlocking" : $("input[name='modeOfBlocking']:checked").val(),
                "redirectUrl" : $("#redirectUrl").val(),
                "maxInActiveTimer" : $("#maxInActiveTimer").val(),
		"maxMinutesForBlockedUrls" : $("#maxMinutesForBlockedUrls").val(),
		"showBlockedURLs" : $("input[name='showBlockedURLs']:checked").val() == "showURLs",
		"challengeLen" : challengeLen
		
	};
	storeGeneralOptions(genOptions);
	chrome.extension.getBackgroundPage().BackGroundManager.setGenOptions(genOptions);
	alert("Options saved");
}

function performConfirmSuccessOpn()
{
	var operationToDo = $("#operationToPerform").val();
	var operand = $("#operandVal").val();
	
	if(operationToDo == 'B')
	{
		deleteBlockSet(operand);
		populateBlockSets();
	}
	
	if(operationToDo == 'W')
	{
		deleteWhiteListedUrl(operand);
		populateWhiteListedUrls();
	}
	
	if(operationToDo == 'T')
	{
		deleteTag(operand);
		populateTags();
	}

	if(operationToDo == 'C')
	{
		var challengeLength = $("#challengeLen").val();
		challengeUser(challengeLength, 'O');
	}


	$("#operationToPerform").val("");
	$("#operandVal").val("");
	$("#confirmMessage").html("");
}

function performConfirmCancel()
{
	var operationToDo = $("#operationToPerform").val();
	var operand = $("#operandVal").val();
	
	if(operationToDo == 'C')
	{
		var oldGenOptions = getGeneralOptions()
		$("#challengeLen").val(oldGenOptions.challengeLen);
	}
	
	$("#operationToPerform").val("");
	$("#operandVal").val("");
	$("#confirmMessage").html("");
}


function setupConfirmMessageDialog()
{
	//courtesy : http://stackoverflow.com/questions/366696/jquery-dialog-box

	confirmMsgDialogObj = $("#confirmMessageDiv");
	confirmMsgDialogObj.dialog({ height: 200,
		width: 500,
		modal: true,
		position: 'center',
		autoOpen:false,
		title:'Confirm',
		overlay: { opacity: 0.5, background: 'black'},
		buttons: { 
			"OK !": function() {
				$(this).dialog("close");
				performConfirmSuccessOpn();
				
			},
			"Cancel !" : function(){
				$(this).dialog("close"); 
				performConfirmCancel();
			}
		}
	});
}

//This function is needed as Chrome behaves erratically with alert and confirm in a popup. It is an open bug from 2008.
//TODO
function handleLowerChallengeLength(challengeLength,oldChallengeLength)
{

	confirmDialogObj.show();
	confirmDialogObj.dialog("open");
}

function saveGeneralOptions()
{
	var krakenTxt = "You have reduced the challenge text's length ! This might make it easier to bypass Chrome Nanny - Do you want to continue ? If you click 'Cancel', the challenge length will be reverted to previous value. If you click 'OK', Chrome Nanny will unleash the Kraken !";
	if(!validateGeneralOptions())
		return;
	
	var oldGenOptions = getGeneralOptions();
	var challengeLength = parseInt($("#challengeLen").val());
	var oldChallengeLength = parseInt(oldGenOptions.challengeLen);

	if(oldChallengeLength > challengeLength)
	{
		//TODO handleLowerChallengeLength(challengeLength,oldChallengeLength);
		callConfirm(krakenTxt, 'C', challengeLength);
	}
	else
	{
		persistGeneralOptions(challengeLength);
	}
}

function validateGeneralOptions()
{
	var maxInActiveTimer = $("#maxInActiveTimer").val();
	if(!isValidMinuteInterval(maxInActiveTimer) || maxInActiveTimer < 5)
	{
		$('#maxInActiveTimer').focus();
		alert('Please enter a number >= 5 !');
		return false;
	}
	
	var maxMinutesForBlockedUrls= $("#maxMinutesForBlockedUrls").val();
	if(!isValidMinuteInterval(maxMinutesForBlockedUrls)) 
	{
		$('#maxMinutesForBlockedUrls').focus();
		alert('Please enter a number between 0 and 1440 !');
		return false;
	}

	var modeOfBlocking = $("input[name='modeOfBlocking']:checked").val();
	if(modeOfBlocking == 'redirect')
	{
		var redirectUrl = $("#redirectUrl").val();
		if(redirectUrl == "" || redirectUrl == null)
		{
			$("#redirectUrl").focus();
			alert('Please enter a redirect url ');
			return false;
		}
		
		var allWhiteListedUrls = chrome.extension.getBackgroundPage().BackGroundManager.whiteList;
		if(checkIfInArrayRegExp(redirectUrl, allWhiteListedUrls) !== false)
			return true;
		
		var allBlockListUrls = chrome.extension.getBackgroundPage().BackGroundManager.blockList;
		if(checkIfInArrayRegExp(redirectUrl, allBlockListUrls) !== false)
		{
			$("#redirectUrl").focus();
			alert('Please enter a redirect url which is not blocked !');
			return false;
		}

		if(redirectUrl.match('http') == null && redirectUrl.match('file') == null && redirectUrl.match('about:') == null)
		{
			$("redirectUrl").focus();
			alert('Please enter the full url (with http or https or file or about:* as protocol )');
			return false;
		}
	}

	return true;
}

function updateTagsInOtherTabs(allTags)
{
	$('#whiteListAllTags').find('option').remove();
	$('#blockListAllTags').find('option').remove();

	$.each(allTags, function(val,text) {
    		$('#whiteListAllTags').append( new Option(text,text) );
    		$('#blockListAllTags').append( new Option(text,text) );
	});
}

function addTagToWhiteListDiv()
{
	var tagName = $('#whiteListAllTags').val();	
	if(tagName == null)
	{
		alert('Please retry after adding new tags in the Tags tab');
		return;
	}
	if(checkIfTagPresentInList('#whiteListTagsUl',tagName))
		return;
	appendItemToUl('#whiteListTagsUl', tagName);
}
	
function checkIfTagPresentInList(ulFieldId,tagName)
{
	var isAlreadyPresentInUL = false;
	$(ulFieldId).find('li').each(function(index) {if($(this).text() == tagName) { isAlreadyPresentInUL = true; return true;} });
	if(isAlreadyPresentInUL)
		alert('Tag already added !');
	return isAlreadyPresentInUL;
}

function setupDialog()
{
	//courtesy : http://stackoverflow.com/questions/366696/jquery-dialog-box
	challengeDialogObj = $("#challengeDiv");
	challengeDialogObj.dialog({ height: 200,
		width: 900,
		modal: true,
		position: 'center',
		autoOpen:false,
		title:'What is the airspeed velocity of an unladen swallow?',
		overlay: { opacity: 0.5, background: 'black'},
		buttons: { 
			"Allow Me !": function() {
				if(verifyChallenge())
				{
					var tempBlockSetName = $("#dialogBlockSet").val();
					var tempEditOrDelete = $("#editOrDeleteBlockSet").val();
					$("#dialogBlockSet").val("");
					$("#editOrDeleteBlockSet").val("");
					if(tempEditOrDelete == 'E')	
						handleEditBlockSet(tempBlockSetName);
					if(tempEditOrDelete == 'D')	
						handleDeleteBlockSet(tempBlockSetName);

					$("#userEnteredText").val("");
					$(this).dialog("close");

					//If option is O , then tempBlockSetName holds the new challenge length
					if(tempEditOrDelete == 'O')	
						persistGeneralOptions(tempBlockSetName);

				}
				else
				{
					$("#origText").val(getRandomStr());
					$("#userEnteredText").val("");
					alert('Oops ! Wrong text . Try again !');
				}
			},
			"I Quit !" : function(){
				$("#userEnteredText").val("");
				$("#dialogBlockSet").val("");
				if($("#editOrDeleteBlockSet").val() == 'O')
				{
					var oldGenOptions = getGeneralOptions();
					$("#challengeLen").val(oldGenOptions.challengeLen);
				}
				$("#editOrDeleteBlockSet").val("");
				$(this).dialog("close"); 
			}
		}
	});
}

function verifyChallenge()
{
	if($("#origText").val() == $("#userEnteredText").val())
		return true;
	else
		return false;
}

function challengeUser(blockSetName,editOrDelete)
{
	var randomStr = getRandomStr();
	if(randomStr == "") //Client did not want any challenge
	{
		if(editOrDelete == 'E')
			handleEditBlockSet(blockSetName);
		if(editOrDelete == 'D')
			handleDeleteBlockSet(blockSetName);
		if(editOrDelete == 'O')
			persistGeneralOptions(blockSetName); //if editOrDelete == 'O', the blockSetName has the new challenge len.
		alert('Giving you a pass as you did not want a Challenge - Consider modifying the General Options setting so that Chrome Nanny has atleast 64 character challenge to avoid temptation!');
	}
	else
	{
		$("#origText").val(randomStr);
		$("#dialogBlockSet").val(blockSetName);
		$("#editOrDeleteBlockSet").val(editOrDelete);
		challengeDialogObj.show();
		challengeDialogObj.dialog("open");
	}
}

function validateRegExp()
{
	if($("#regExpUrl").val() == "")
	{
		$("#regExpUrl").focus();
		alert('Please enter a valid Regular Expression !');
		return false;
	}

	var regExpUrl = $("#regExpUrl").val();
	var testUrl = $("#urlToTest").val();

	$("#errorResultSpan").html("");
	$("#matchResultSpan").html("");

	var isRegExpValid = true;

	try
	{
		r = new RegExp(regExpUrl);
	}
	catch(e)
	{
		isRegExpValid = false;
		$("#errorResultSpan").html(e.message);
	}
	if(!isRegExpValid) return;
		
	$("#errorResultSpan").html("No error in Regular Expression");


	/* If we come here we know that reg exp is valid */
	if(testUrl == "") return ; //nothing to test

	testUrl = testUrl.toLowerCase();
	if(r.test(testUrl))
	{
		$("#matchResultSpan").html("Regular Expression matches test URL.");
	}
	else
	{
		$("#matchResultSpan").html("Regular Expression does not match test URL.");
	}

}

function resetRegExpFlds()
{
	$("#regExpUrl").val("");
	$("#urlToTest").val("");

	$("#errorResultSpan").html("");
	$("#matchResultSpan").html("");
}

function populateLockDown()
{
	var dtlsStr = "";
	var blockSetDtls = "";
	var allBlockSets = getAllBlockSets();
	var i=0;

	if(!isIntervalSet)
	{
		isIntervalSet = true;
		optionIntervalTimerId = setInterval('refreshLockDownDtls()', 60 * 1000); //1 minute
	}
	
	refreshLockDownDtls();

	$.each(new Array(0,1,2,3,4,5,6,10,12,18,24),function(k,v){dtlsStr += '<option value="' + v + '">' + v + '</option>';});
	$("select#lockDownHrs").html(dtlsStr);

	dtlsStr = "";
	for(i=0;i<=55;i+=5)
		dtlsStr += '<option value="' + i + '">' + i + '</option>';
	$("select#lockDownMins").html(dtlsStr);
		
	
	dtlsStr = "";
	allBlockSets = allBlockSets.sort(sortBlockSetsBasedOnName);
        $.each(allBlockSets, function(key, blockSetName){
                blockSetDtls = getBlockSetDtls(blockSetName);
		dtlsStr += '<input type="checkbox" name="lockDownBlockSets[]" value="' + blockSetDtls.internalName + '" />' + blockSetDtls.name + "(" + blockSetDtls.urls.join(",") + ")<br>";
        });

	$("#allBlockSetsToLockDown").html(dtlsStr);
}

function getLockDownInfoText()
{
	var lockDownDtls = getLockDownDtls();
	
	var dtlsStr = "";
	if(!isLockDownActive(lockDownDtls))
	{
		dtlsStr = "No lockdown is active currently";	
	}
	else
	{
		var d = new Date();
		var lockDownEndTime = lockDownDtls.startTime + lockDownDtls.durationInMilliSecs;
		d.setTime(lockDownEndTime);

		var lockDownBlockSetNames = new Array();
		var blockSetDtls = "";
		$.each(lockDownDtls.blockSetsToLock, function(key,val){
			console.log(key + "," + val);
			blockSetDtls = getBlockSetDtls(val);
			lockDownBlockSetNames.push(blockSetDtls.name);
			console.log(blockSetDtls.name);
		});
		dtlsStr = "A lockdown is active for blockset(s) \"" + lockDownBlockSetNames.join(",") +  "\" till " + d.toLocaleString();	
	}
	return dtlsStr;
}

function refreshLockDownDtls()
{
	var lockDownDtls = getLockDownDtls();
	if(!isLockDownActive(lockDownDtls))
	{
		$("#beginLockDownBtn").attr("disabled",false)	
		if(lockDownDtls != null)
			storeLockDownDtls(null);
	}
	else
	{
		$("#beginLockDownBtn").attr("disabled",true)	
	}

	var dtlsStr = getLockDownInfoText();
	$('#lockDownInfoText').html(dtlsStr);
}

function selectAllLockDown()
{
	$("input[name='lockDownBlockSets\[\]']").each(function(){this.checked=true;});
}

function unSelectAllLockDown()
{
	$("input[name='lockDownBlockSets\[\]']").each(function(){this.checked=false;});
}

function isLockDownActive(lockDownDtls)
{
	if(lockDownDtls == null)
		return false;
	var curTimeInMilliSecs = new Date().getTime();
	var lockDownEndTime = lockDownDtls.startTime + lockDownDtls.durationInMilliSecs;
	if(curTimeInMilliSecs < lockDownEndTime)
		return true;
	return false;
}

function isBlockSetLockedDown(blockSetInternalName)
{
	var lockDownDtls = getLockDownDtls();
	if(lockDownDtls == null)
		return false;
	if(checkIfInArray(blockSetInternalName, lockDownDtls.blockSetsToLock))
		return true;
	return false;
}

function validateLockDown()
{
	var numItemsSelected = 0;
	$("input[name='lockDownBlockSets\[\]']").each(function(){
		if(this.checked)
			numItemsSelected += 1;
	});
	
	if(numItemsSelected == 0)
	{
		alert('Please select atleast one blockset for blocking !');
		return false;
	}
	
	if($("#lockDownHrs").val() == 0  && $("#lockDownMins").val() == 0)
	{
		alert('Please select a non empty chunk of time to block !');
		return false;
	}

	if(isLockDownActive())
	{
		alert('Only one lockdown can be active at a time. Please click refresh to see lockdown details');
		return false;
	}

	return true;
}

function beginLockDown()
{
	if(!validateLockDown())
		return;
	
	var blockSetsToLock = new Array();
	$("input[name='lockDownBlockSets\[\]']").each(function(){
		if(this.checked)
			blockSetsToLock.push(this.value);
	});

	var lockDownDtls = {};
	var curTime = new Date();
	curTime.setSeconds(0); //it will be better if lockdown begins and ends in a "proper" minute instead of a:b:16 seconds.

	lockDownDtls['startTime'] = curTime.getTime();
	lockDownDtls['durationInMilliSecs'] = (parseInt($("#lockDownHrs").val(),10)*3600 + parseInt($("#lockDownMins").val(),10) * 60) * 1000;
	lockDownDtls['blockSetsToLock'] = blockSetsToLock;
	storeLockDownDtls(lockDownDtls);
	refreshLockDownDtls();
}


