//gig

function isBlockSetsNotPresent()
{
	var allBlockSets = localStorage.getItem("allBlockSets");
	return (allBlockSets == null);
}

function validateIfUrlsAreUnique(blockSetDtls)
{
	var urlDtls ;
	var result = true;
	$.each(blockSetDtls.urls, function(key, url){
		urlDtls = getBlockedUrlDtls(url);
		if(getNumElemsInHash(urlDtls) > 0)
		{
			if(urlDtls.blockSetName != blockSetDtls.internalName)
	       			result = false;
		}
	});
	return result;
}

function storeBlockSet(blockSetDtls,blockSetTagsArr)
{
	if(blockSetDtls == null) return;
	deleteBlockSet(blockSetDtls.internalName);

	appendBlockSet(blockSetDtls.internalName);
	localStorage.setItem(blockSetDtls.internalName, JSON.stringify(blockSetDtls));

	var urlDtls = {};
	$.each(blockSetDtls.urls, function(key, url){
		if(url != "")
		{
			urlDtls = {};

			urlDtls["url"] = $.trim(url);
			urlDtls["interval"] = blockSetDtls.interval;
			urlDtls["maxTime"] = blockSetDtls.maxTime;
			urlDtls["maxTimeUnit"] = blockSetDtls.maxTimeUnit;
			urlDtls["activeDays"] = blockSetDtls.activeDays;
			urlDtls["blockSetName"] = blockSetDtls.internalName;
			storeBlockedUrl(urlDtls);
		}
	});
	
	$.each(blockSetTagsArr, function(key,tagName) {addUrlToTag(blockSetDtls.internalName,tagName)} ); 
}

function storeBlockedUrl(urlDtls)
{
	if(urlDtls == null) return;
	urlDtls.url = $.trim(urlDtls.url);
	appendBlockedUrl(urlDtls.url);
	localStorage.setItem(urlDtls.url, JSON.stringify(urlDtls));
}

function getAllBlockSets()
{
	var allBlockSets = localStorage.getItem("allBlockSets");
	var retVal = (allBlockSets == null)? [] : JSON.parse(allBlockSets);
	return retVal;
}

function getAllBlockedUrls()
{
	var allBlockedUrlsStr = localStorage.getItem("blockedUrls");
	if(allBlockedUrlsStr == null)
		return [];
	var allBlockedUrlsArr = JSON.parse(allBlockedUrlsStr);
	return allBlockedUrlsArr;
}

function getBlockSetDtls(blockSetName)
{
	var blockSetDtls = {} , blockSetDtlsStr = "";
	if(blockSetName == null) return blockSetDtls;

	blockSetDtlsStr = localStorage.getItem(blockSetName);
	if(blockSetDtlsStr == null) return blockSetDtls;
	blockSetDtls = JSON.parse(blockSetDtlsStr);
	return blockSetDtls;
}

function getBlockedUrlDtls(url)
{
	if(url == null)
		return {};
	var urlDtls = localStorage.getItem(url);
	urlDtls = (urlDtls == null) ? {} : JSON.parse(urlDtls);
	return urlDtls;
}

function getAllBlockedUrlDtls()
{
	var allBlockedUrlsArr= getAllBlockedUrls();
	var allBlockedUrlDtlsHash= {}; 
	var url = "";
	for(var urlIndex in allBlockedUrlsArr)
	{
		var url = allBlockedUrlsArr[urlIndex];
		if(url == "" || url == null) continue;
		var urlDtls = localStorage.getItem(url);
		if(urlDtls != null)
			allBlockedUrlDtlsHash[url] = JSON.parse(urlDtls);
	}
	return allBlockedUrlDtlsHash;
}

function deleteBlockSet(blockSetName)
{
	var allBlockSets = getAllBlockSets();
	allBlockSets = removeElementFromArray(blockSetName, allBlockSets);
	storeAllBlockSets(allBlockSets);

	var blockSetDtls = getBlockSetDtls(blockSetName);
	if(getNumElemsInHash(blockSetDtls) > 0 )
	{
		$.each(blockSetDtls.urls, function(key,url) {
			deleteBlockedUrl(url);
		});
	}
	removeUrlFromAllTags(blockSetName);
	localStorage.removeItem(blockSetName);
}

function deleteBlockedUrl(url)
{
	//note url is not removed from tag array as only blockSetName is present in it for blockd urls.
	var allBlockedUrlsArr = getAllBlockedUrls();
	allBlockedUrlsArr = removeElementFromArray(url,allBlockedUrlsArr);
	localStorage["blockedUrls"] = JSON.stringify(allBlockedUrlsArr);
	localStorage.removeItem(url);
}

function storeAllBlockSets(allBlockSets)
{
	localStorage.setItem("allBlockSets", JSON.stringify(allBlockSets));
}

function storeAllBlockedUrls(allBlockedUrlsArr)
{
	var allBlockedUrlsStr = JSON.stringify(allBlockedUrlsArr);
	localStorage.setItem("blockedUrls",allBlockedUrlsStr);
}

function appendBlockSet(blockSetName)
{
	var allBlockSets = getAllBlockSets();
	if(!checkIfInArray(blockSetName,allBlockSets))
	{
		allBlockSets.push(blockSetName);
		storeAllBlockSets(allBlockSets);
	}
}

function appendBlockedUrl(blockedUrl)
{
	var allBlockedUrls = getAllBlockedUrls();
	if(!checkIfInArray(blockedUrl,allBlockedUrls))
	{
		allBlockedUrls.push(blockedUrl);
		storeAllBlockedUrls(allBlockedUrls);
	}
}

function getAllTags()
{
	var allTagsStr = localStorage.getItem("allTags");
	if(allTagsStr == null)
		return [];
	return JSON.parse(allTagsStr);
}

function storeTag(tagName)
{
	var allTagsArr = getAllTags();
	if(checkIfInArray(tagName,allTagsArr,true))
	{
		alert('Tag already added !');
		return;
	}
	allTagsArr.push(tagName);
	localStorage.setItem("allTags",JSON.stringify(allTagsArr));
	localStorage.setItem(tagName, JSON.stringify([]));
}

function deleteTag(tagName)
{
	var allTagsArr = getAllTags();
	localStorage.removeItem(tagName);
	allTagsArr = removeElementFromArray(tagName,allTagsArr);
	localStorage.setItem("allTags",JSON.stringify(allTagsArr));
}

function getAllWhiteListedUrls()
{
	var allUrlsStr = localStorage.getItem("whiteListedUrls");
	if(allUrlsStr == null)
		return [];
	return JSON.parse(allUrlsStr);
}

function storeWhiteListedUrl(url,urlTagsArr)
{
	if(url == null) return;
	if(urlTagsArr == null) urlTagsArr = [];

	var allUrlsArr= getAllWhiteListedUrls();
	if(!checkIfInArray(url,allUrlsArr))
	{
		allUrlsArr.push(url);
		localStorage.setItem("whiteListedUrls",JSON.stringify(allUrlsArr));
	}
	localStorage.setItem(url,JSON.stringify({})); //for future

	removeUrlFromAllTags(url);
	$.each(urlTagsArr, function(key,value) {addUrlToTag(url,value)} ); 
}

function deleteWhiteListedUrl(url)
{
	var allUrls= getAllWhiteListedUrls();
	allUrls = removeElementFromArray(url,allUrls);
	removeUrlFromAllTags(url);
	localStorage.removeItem(url);
	localStorage.setItem("whiteListedUrls",JSON.stringify(allUrls));
}

function addUrlToTag(url,tagName)
{
	if(url == null || tagName == null)
		return;

	var allUrlsInTag = getUrlsForTag(tagName);
	if(!checkIfInArray(url,allUrlsInTag))
	{
		allUrlsInTag.push(url);
		localStorage.setItem(tagName,JSON.stringify(allUrlsInTag));
	}
}

function removeUrlFromTag(url,tagName)
{
	if(url == null || tagName == null)
		return;

	var allUrlsInTag = getUrlsForTag(tagName);
	if(checkIfInArray(url,allUrlsInTag))
	{
		allUrlsInTag = removeElementFromArray(url,allUrlsInTag);
		localStorage.setItem(tagName,JSON.stringify(allUrlsInTag));
	}
}

function getUrlsForTag(tagName)
{
	var tagUrls = [];
	if(tagName == null)
		return tagUrls;
	tagUrlsStr = localStorage.getItem(tagName);
	if(tagUrlsStr == null)
		return tagUrls;
	return JSON.parse(tagUrlsStr);
}

function removeUrlFromAllTags(url)
{
	var allTagsArr = getAllTags();
	$.each(allTagsArr, function(key,value) { removeUrlFromTag(url,value);} ); 
}

function getAllTagsForUrl(url)
{
	var allTagsOfUrl = [];
	if(url == null)
		return allTagsOfUrl;
	var allTags = getAllTags();
	var tagUrls = [];
	$.each(allTags, function(key,value) {
		tagUrls = getUrlsForTag(value);
		if(checkIfInArray(url,tagUrls))
			allTagsOfUrl.push(value);
	});

	return allTagsOfUrl;
}

function getGeneralOptions()
{
	var genOptions = localStorage.getItem("genOptions");
	genOptions = (genOptions == null) ? {} : JSON.parse(genOptions);
	genOptions = populateDefaultValuesIfNecessary(genOptions);
	return genOptions;
}

function populateDefaultValuesIfNecessary(genOptions)
{
	if(genOptions.modeOfBlocking == null)
	{
		genOptions.modeOfBlocking = 'showblocked';
		genOptions.redirectUrl = "";
	}
	
	if(genOptions.modeOfBlocking == 'remove' || genOptions.modeOfBlocking == 'showblocked')
		genOptions.redirectUrl = "";

	if(genOptions.redirectUrl == null)
	{
		genOptions.redirectUrl = "";
		genOptions.modeOfBlocking = 'showblocked';
	}

	if(genOptions.maxInActiveTimer == null)
		genOptions.maxInActiveTimer= 5;
	if(genOptions.maxMinutesForBlockedUrls == null)
		genOptions.maxMinutesForBlockedUrls = 0;

	if(genOptions.showBlockedURLs == null)
		genOptions.showBlockedURLs = true;

	if(genOptions.challengeLen == null)
		genOptions.challengeLen = 64;

	return genOptions;
}

function getItemWithDefault(key,defaultValue)
{
	var value = localStorage.getItem(key);
	return (value == null) ? defaultValue : value;
}

function storeGeneralOptions(genOptions)
{
	localStorage.setItem("genOptions",JSON.stringify(genOptions));
}

function updateStatsForDay(day,stats)
{
	if(day == null || stats == null)
		return false;
	localStorage.setItem(day,JSON.stringify(stats));
	return true;
}

function getStatsForDay(day)
{
	var statsForDay = {};
	if(day == null)
		return statsForDay;
	else
	{
		statsForDay = localStorage.getItem(day);
		if(statsForDay == null) return {};
		statsForDay = JSON.parse(statsForDay);
	}
	return statsForDay;
}

function getStatsForDateRange(from,to)
{
	from = new Date(from);
	to = new Date(to);
	var toTimeStamp = to.getTime();
	var entireRangeStats = {};
	var dayStats = {};

	while(from.getTime() <=	toTimeStamp)
	{
		dayStats = getStatsForDay(getDateStr(from));
		$.each(dayStats, function(url,count){
			entireRangeStats[url] = (entireRangeStats[url] ||0 ) + (dayStats[url] || 0);
		});

		from.addDays(1);
	}
	return entireRangeStats;
}

function migrateBlockSetsIfNecessary()
{
	if(!isBlockSetsNotPresent())
		return ;
	console.log('Migrating blocksets!');
	var allBlockSets = [],urls = [];
	var index = 1;
	var allBlockedUrlsArr = getAllBlockedUrls();
	var urlDtls = {}, blockSetDtls = {}, allTagsForUrl = [];

	localStorage.setItem("allBlockSets", JSON.stringify([]));

	$.each(allBlockedUrlsArr, function(key,url){
		blockSetDtls = {};
		urlDtls = getBlockedUrlDtls(url);

		urls = []; 
		urls.push(url);

		allTagsForUrl = getAllTagsForUrl(url);
		removeUrlFromAllTags(url);

		blockSetDtls.name = "Block Set " + index;
		blockSetDtls.urls = urls;
		blockSetDtls.interval = urlDtls.interval;
		blockSetDtls.maxTime = urlDtls.maxTime;
		blockSetDtls.activeDays = urlDtls.activeDays;
		blockSetDtls.internalName = "BlockSet" + new Date().getTime();
		storeBlockSet(blockSetDtls,allTagsForUrl);

		index++;
	});
}

function migrateHrLimitsIfNecessary()
{
	var isHrLtMigrated = localStorage.getItem("migrateHrLimits");	
	if(isHrLtMigrated != null)
		return;
	console.log('Going to migrate hour limits');
		
	var blockSetDtls = null, tagsForBlockSet = null;
	var allBlockSetsArr = getAllBlockSets();
	$.each(allBlockSetsArr, function(key,blockSetName){
		blockSetDtls = {};
		blockSetDtls = getBlockSetDtls(blockSetName);
		blockSetDtls.maxTimeUnit = 24;
		tagsForBlockSet = getAllTagsForUrl(blockSetName);
		storeBlockSet(blockSetDtls,tagsForBlockSet);
	});

	localStorage.setItem("migrateHrLimits",true);
}

function migrateIfNecessary()
{
	migrateBlockSetsIfNecessary();
	migrateHrLimitsIfNecessary();
}

function storeLockDownDtls(lockDownDtls)
{
	localStorage.setItem("lockDownDtls", JSON.stringify(lockDownDtls));	
}

function getLockDownDtls()
{
	return JSON.parse(localStorage.getItem("lockDownDtls"));
}
