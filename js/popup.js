function getDetailsForPopup()
{
	var allBlockListUrls = chrome.extension.getBackgroundPage().BackGroundManager.blockList;

	var urlsBlockedNow = [];
	var urlsNotBlocked = {};
	var timeRemaining = 0;

	$.each(allBlockListUrls, function(index,url){
		if(chrome.extension.getBackgroundPage().BackGroundManager.checkIfUrlShudBeBlockedNOW(url))
			urlsBlockedNow.push(url);
		else
		{
			timeRemaining = chrome.extension.getBackgroundPage().BackGroundManager.getTimeRemaining(url);	
			if(timeRemaining <= 0)
				urlsBlockedNow.push(url);
			else
				urlsNotBlocked[url] = timeRemaining;
		}
	});

	var allWhiteListedUrls = chrome.extension.getBackgroundPage().BackGroundManager.whiteList;
	var whiteListStats = {};
	var timeUsed = 0;
	$.each(allWhiteListedUrls, function(index,url){
		timeUsed = chrome.extension.getBackgroundPage().BackGroundManager.getTimeUsed(url);
		if(timeUsed > 0)
			whiteListStats[url] = timeUsed;
	});

	return {blocked : urlsBlockedNow, allowed: urlsNotBlocked, whiteListStats : whiteListStats};
}

function blockPopupInfoIfNeeded()
{
	//var genOptions = chrome.extension.getBackgroundPage().BackGroundManager.genOptions;
	var genOptions = getGeneralOptions();

	console.log(genOptions);
	if(genOptions.showBlockedURLs != true)
	{
		$("#lockdownPopupTbl").hide();
		$("#blockedUrlTbl").hide();
		$("#allowedUrlTbl").hide();
		$("#whiteListedUrlTbl").hide();
	}
	return;
}

function fillFieldsInPopup()
{

	$("#lockdownPopupTbl").append("<tr class='tDataGridElement'><td>" + getLockDownInfoText() + "</td></tr>");

	var urls = getDetailsForPopup();

	if(urls.blocked.length == 0)
	{
		$("#blockedUrlTbl").append("<tr class='tDataGridElement'><td>None !</td></tr>");
	}
	else
	{
		$.each(urls.blocked, function(index,url){
			//$("#blockedUrlDiv").append("<li class='item'>" + url + "</li>");
			$("#blockedUrlTbl").append("<tr class='tDataGridElement'><td>" + url + "</td></tr>");
		});
	}


	var allowedInHrStr = "";	
	var numUrls = getNumElemsInHash(urls.allowed);
	if(numUrls == 0)
	{
		$("#allowedUrlTbl").append("<tr class='tDataGridElement'><td colspan='2'>Hurray ! There are None !</td></tr>");
	}
	else
	{
		$.each(urls.allowed, function(url,timeAllowed){
			allowedInHrStr = convertMinToHrMinStrLong(timeAllowed);
			$("#allowedUrlTbl").append("<tr class='tDataGridElement'><td>" + url + "</td><td>" + allowedInHrStr +" left</td></tr>");
		});
	}

	var numUrls = getNumElemsInHash(urls.whiteListStats);
	if(numUrls == 0)
	{
		$("#whiteListedUrlTbl").append("<tr class='tDataGridElement'><td colspan='2'>No time spent on White Listed URLs !</td></tr>");
	}
	else
	{
		$.each(urls.whiteListStats, function(url,timeAllowed){
			allowedInHrStr = convertMinToHrMinStrLong(timeAllowed);
			$("#whiteListedUrlTbl").append("<tr class='tDataGridElement'><td>" + url + "</td><td>" + allowedInHrStr +" used</td></tr>");
		});
	}

	blockPopupInfoIfNeeded();
}
