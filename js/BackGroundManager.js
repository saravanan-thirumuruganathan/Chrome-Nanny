BackGroundManager = {
	dayHash : {}, 
	tabHash : {} ,
	lastEventTime : "",
	isLocked : false,
	minsSinceLastSave : 1,
	currentTabId : null,
	currentTabUrl : null,
	blockList : [],
	blockListDtls : {},
	whiteList : [],
	tags : [],
	genOptions : {},
	intervalTimerId : null,
	inactiveTimerInterval : 0,
	hrLtStats : {},

	initAll : function() {
		migrateIfNecessary();
		BackGroundManager.initializeVariables();
		BackGroundManager.registerFunctions();
	},

	initializeHrLtStats : function(){
		var tempHrLtStats = localStorage.getItem('hrLtStats');
		var dayStr = getDateStr(); 

		//Case 1 : Today is a new day and this is the first time browser is opened today.
		if(tempHrLtStats == null)
		{
			BackGroundManager.hrLtStats = {} ;
			BackGroundManager.hrLtStats['todayDayStr'] = dayStr;
			return;
		}

		tempHrLtStats = JSON.parse(tempHrLtStats);

		//Case 2 : Day rolled over as Chrome was being used.
		if(tempHrLtStats['todayDayStr'] != dayStr)
		{
			BackGroundManager.hrLtStats = {} ;
			BackGroundManager.hrLtStats['todayDayStr'] = dayStr;
			return;
		}

		//Case 3 : Chrome was used earlier and same date and we may have to reuse some old data 
		//	previously persisted.
		BackGroundManager.hrLtStats = {} ;
		BackGroundManager.hrLtStats['todayDayStr'] = dayStr;
		var urlDtls = {};
		var curDateObj = new Date();
		var curHr = curDateObj.getHours();
		var startPeriod = 0;
		$.each(tempHrLtStats, function(url, urlStats){
			if(url != 'todayDayStr' && urlStats != null)
			{
				startPeriod = 0;
				urlDtls = getBlockedUrlDtls(url);
				if(urlDtls != null)
				{
					//Lets say a url chks for 10 mins in 4 hrs. If prev stat was for 4:00 - 7:59
					//	and cur time is 8:10, dont copy the stats.
					startPeriod = Math.floor(curHr/urlDtls.maxTimeUnit) * urlDtls.maxTimeUnit;
					if(urlStats.startPeriod == startPeriod)
					{
						BackGroundManager.hrLtStats[url] = urlStats;
					}
				}
			}
		});

		BackGroundManager.storeHrLtStats();
	},

	initializeVariables : function() {
		var d = new Date();
		var dayStr = getDateStr(d); 
		BackGroundManager.dayHash[dayStr] = getStatsForDay(dayStr);
		BackGroundManager.tabHash = {};
		BackGroundManager.lastEventTime= d.getTime();
		BackGroundManager.isLocked = false;
		BackGroundManager.minsSinceLastSave = 1; //so that it does not save on start !
		BackGroundManager.currentTabId = null;
		BackGroundManager.currentTabUrl = null;
		BackGroundManager.blockList = getAllBlockedUrls();
		BackGroundManager.blockListDtls = getAllBlockedUrlDtls();
		BackGroundManager.whiteList = getAllWhiteListedUrls();
		BackGroundManager.tags = getAllTags();
		BackGroundManager.genOptions = getGeneralOptions();
		BackGroundManager.inactiveTimerInterval = 60 * 1000; //1 minute
		BackGroundManager.intervalTimerId = setInterval('BackGroundManager.checkForInActivity()', BackGroundManager.inactiveTimerInterval);

		BackGroundManager.initializeHrLtStats();
	},

	registerFunctions : function(){
		chrome.tabs.onSelectionChanged.addListener(BackGroundManager.onTabSelectionChanged);
		chrome.tabs.onUpdated.addListener(BackGroundManager.onTabUpdated);
		chrome.windows.onFocusChanged.addListener(BackGroundManager.onWindowFocusChanged);
		chrome.windows.onRemoved.addListener(BackGroundManager.onWindowRemoved);
	},

	setBlockList : function(blockListUrls,blockListDtls){
		BackGroundManager.blockList = blockListUrls;
		BackGroundManager.blockListDtls = blockListDtls;
	},

	setWhiteList : function(whiteList){
		BackGroundManager.whiteList = whiteList;
	},
	
	setTags : function(tags){
		BackGroundManager.tags = tags;
	},
	
	setGenOptions: function(genOptions){
		BackGroundManager.genOptions = genOptions;
	},

	setTimeOfLastEvent : function(){
		BackGroundManager.lastEventTime = new Date().getTime();
	},

	getMaxInActiveTime : function() {
		var val = BackGroundManager.genOptions.maxInActiveTimer;
		if(val == null || val < 5 ) val = 5;
		return val;
	},

	shudStoreStats : function(){
		//hard coded - save stats every 5 minutes.
		return (BackGroundManager.minsSinceLastSave++ % 5  == 0)
	},

	checkForInActivity : function(){
		var d = new Date().getTime();
		var statHash = BackGroundManager.getStatHashForToday();
	
		if(BackGroundManager.shudStoreStats())
		{
			console.log('periodic storing of stats');
			BackGroundManager.storeStats();
		}
		else
		{
			//storeStats also calls storeHrLtStats anyways. This line will ensure that
			//	the hrLts are stored every min.
			BackGroundManager.storeHrLtStats();
		}

		var elapsedTimeInMinutes = Math.ceil((d - BackGroundManager.lastEventTime) / (60 *1000) );
		if( elapsedTimeInMinutes > BackGroundManager.getMaxInActiveTime())
		{
			console.log('looks like no action for long time !');
			//If the user was in the site for 10 minutes and was inactive for 5 minutes, then store 
			//	the 5 minutes to stats but only if the site was trackable.
			var tabDtls = BackGroundManager.tabHash[BackGroundManager.currentTabId];
			if(tabDtls != null)
			{
				if(tabDtls.isInActive == true)
				{
					tabDtls.lastOpTime = d;
					BackGroundManager.tabHash[BackGroundManager.currentTabId] = tabDtls;
					return;
				}
				var actualTimeSpentOnThisTab = Math.ceil((d - (tabDtls.lastOpTime || d)) / 1000) ;	
				actualTimeSpentOnThisTab = actualTimeSpentOnThisTab- (BackGroundManager.getMaxInActiveTime() * 60);
				if(actualTimeSpentOnThisTab > 0)
					statHash[tabDtls.url] = (statHash[tabDtls.url] || 0) +  actualTimeSpentOnThisTab;
				console.log(' this tab is measurable - adding ' + actualTimeSpentOnThisTab + ' seconds to the stats ');

				tabDtls.lastOpTime = d;
				tabDtls.isInActive = true;
				BackGroundManager.tabHash[BackGroundManager.currentTabId] = tabDtls;
			}
		}

		BackGroundManager.blockOrUpdateStats(BackGroundManager.currentTabId, BackGroundManager.currentTabUrl);
		BackGroundManager.activelyBlockPages();

	},

	getStatHashForToday : function(){
		var d = getDateStr();
		if(BackGroundManager.dayHash[d] == null)
			BackGroundManager.dayHash[d] = {};
		return BackGroundManager.dayHash[d] ;
	},

	shudUrlBeBlockedToday : function(url){
		var d = new Date();
		var urlDtls = BackGroundManager.blockListDtls[url];
		if(urlDtls == null || urlDtls == {})
			return false;

		var dayOfWeek = d.getDay() + "";
		if(urlDtls.activeDays.match(dayOfWeek) == null)
			return false;
		return true;
	},
	
	isUrlBlockedDuringCurTime: function(url){
		var d = new Date();
		var urlDtls = BackGroundManager.blockListDtls[url];
		var hrMin = d.getHours() * 60 + d.getMinutes();
		var shudBlocked = false;
		$.each(urlDtls.interval,function(key,value){
			if(hrMin >= value.start && hrMin <= value.end)
			{
				shudBlocked = true;
			}
		});

		return shudBlocked;
	},

	getTotalTimeUsedByBlockSet : function(blockSetName){
		var statHash = BackGroundManager.getStatHashForToday();
		var blockSetDtls = getBlockSetDtls(blockSetName);
		var totSecs = 0,curSecs = 0;
		if(blockSetDtls.urls != null)
		{
			$.each(blockSetDtls.urls, function(key,url){
				curSecs = statHash[url] || 0;
				totSecs += curSecs;
			});
		}
		return totSecs;
	},

	getTimeUsedByBlockSetForThisPeriod : function(blockSetName){
		var blockSetDtls = getBlockSetDtls(blockSetName);
                var curDateObj = new Date();
                var curHr = curDateObj.getHours();
                var startPeriod = 0;
		startPeriod = Math.floor(curHr/blockSetDtls.maxTimeUnit) * blockSetDtls.maxTimeUnit;
		var totSecs = 0,curSecs = 0;

		if(blockSetDtls.urls != null)
		{
			$.each(blockSetDtls.urls, function(key,url){
				curSecs = 0;
				if(BackGroundManager.hrLtStats[url] != null)
				{
					if(BackGroundManager.hrLtStats[url]['startPeriod'] == startPeriod)
						curSecs =  BackGroundManager.hrLtStats[url]['numSecs'];
				}
				totSecs += curSecs;
			});
		}
		return totSecs;
	},

	checkIfBlockSetShudBeBlockedNOW : function(blockSetName){
		if(blockSetName == null) return false;
	
		//Even though we send only one url, check for entire blockset is made below.
		var url = getBlockSetDtls(blockSetName).urls[0];
		return BackGroundManager.checkIfUrlShudBeBlockedNOW(url);
	},

	checkIfUrlShudBeBlockedNOW : function(url) {
		/* If the control comes here , then it means that the url is a black listed url */
		var urlDtls = BackGroundManager.blockListDtls[url];
		//console.log(urlDtls);
		
		//Lockdown check is always the first check to do.
		console.log('calling with ' + urlDtls.blockSetName);
		if(isBlockSetLockedDown(urlDtls.blockSetName))
		{
			console.log('isBlockSetLockedDown returned true');
			return true;
		}
		else
		{
			console.log('isBlockSetLockedDown returned false');
		}


		var shudBeBlockedToday = BackGroundManager.shudUrlBeBlockedToday(url);
		if(!shudBeBlockedToday)
			return false;
	
		var totalTimeSpentTodayInSecs = BackGroundManager.getTimeUsedForAllBlockedURLs();
		var maxAllowedSecsInADay = BackGroundManager.genOptions.maxMinutesForBlockedUrls * 60;
		if(maxAllowedSecsInADay > 0)
		{
			if(totalTimeSpentTodayInSecs >= maxAllowedSecsInADay)
				return true;
		}

		var survivedBasicTest = BackGroundManager.isUrlBlockedDuringCurTime(url);
		if(survivedBasicTest)
			return true;

		var d = new Date();

		var maxTime = urlDtls.maxTime;
		if(maxTime == 0 || maxTime == null || maxTime == "")
			return false;
		
		maxTime = maxTime * 60; //convert to seconds
		var blockSetStats = {};

		if(urlDtls.maxTimeUnit == 24)
		{
			blockSetStats = BackGroundManager.getTotalTimeUsedByBlockSet(urlDtls.blockSetName);
			console.log(url + "'s blockset " + urlDtls.blockSetName + ' has used ' + blockSetStats + ' seconds today but maxtime is ' + maxTime + ' every day');
			if(blockSetStats >= maxTime)
				return true;
		}
		else
		{
			blockSetStats = BackGroundManager.getTimeUsedByBlockSetForThisPeriod(urlDtls.blockSetName);
			console.log(url + "'s blockset " + urlDtls.blockSetName + ' has used ' + blockSetStats + ' seconds but maxtime is ' + maxTime + ' mins every ' + urlDtls.maxTimeUnit + ' hours' );
			if(blockSetStats >= maxTime)
				return true;
		}

		
		return false;
	},

	getTimeRemaining : function(url){
		var maxMinsADay = BackGroundManager.genOptions.maxMinutesForBlockedUrls;
		var maxAllowedSecsInADay = maxMinsADay * 60;
		var minsLeft1 = 1440;//max possible value !
		if(maxAllowedSecsInADay > 0)
		{
			var totalTimeSpentTodayInSecs = BackGroundManager.getTimeUsedForAllBlockedURLs();
			if(totalTimeSpentTodayInSecs >= maxAllowedSecsInADay)
				minsLeft1 = 0;
			else
			{
				//TODO: Dichotomy : formula here subtracts and ceils. Formula at end ceils and subtracts
				minsLeft1 = maxMinsADay -  Math.ceil(totalTimeSpentTodayInSecs/60);
			}
		}
		console.log('Mins left from daily limit is :' + minsLeft1);

		var urlDtls = BackGroundManager.blockListDtls[url];
		if(urlDtls == null || urlDtls == {})
			return 0;
		var maxTime = urlDtls.maxTime;
		var allowed = maxTime;
		console.log('Max limit for BlockSet : ' + allowed);

		if(maxTime == 0 || maxTime == null || maxTime == "")
		{
			var d = new Date();
			var curTimeInHrMin = d.getHours() * 60 + d.getMinutes();

			var totalMinsAllowed = 1440 - curTimeInHrMin;
			$.each(urlDtls.interval,function(key,value){
				if(value.start >= curTimeInHrMin)
					totalMinsAllowed -= (value.end - value.start);
			});
			allowed = totalMinsAllowed;
			console.log('Mins left till end of day :' + allowed);
		}

		//timeSpentTodayInSecs here is for the whole block set

		var timeSpentTodayInSecs = 0;
		if(urlDtls.maxTimeUnit == 24)
			timeSpentTodayInSecs = BackGroundManager.getTotalTimeUsedByBlockSet(urlDtls.blockSetName);
		else
			timeSpentTodayInSecs = BackGroundManager.getTimeUsedByBlockSetForThisPeriod(urlDtls.blockSetName);

		console.log('Time Spent in blockset (secs) : ' + timeSpentTodayInSecs);
		if(maxTime > 0)
			allowed = allowed - Math.ceil(timeSpentTodayInSecs/60); //convert to mins 
		if(minsLeft1 < allowed)
			allowed = minsLeft1;
		console.log('Minimum no of mins left :' + allowed);
		if(allowed < 0)
			allowed = 0;
		return allowed;
	},

	getTimeUsed : function(url){
		var statHash = BackGroundManager.getStatHashForToday();
		var timeSpentToday = statHash[url];
		if(timeSpentToday == null || timeSpentToday == "")
			timeSpentToday = 0;
		timeSpentToday = Math.ceil(timeSpentToday/60);
		return timeSpentToday;
	},

	//returns total time used by blocked URLs in seconds
	getTimeUsedForAllBlockedURLs : function(){
		var allBlockListUrls = BackGroundManager.blockList;
		var statHash = BackGroundManager.getStatHashForToday();
		var totalTime = 0;
		var timeSpentToday = 0;

		$.each(allBlockListUrls, function(index,url) { 
			timeSpentToday = statHash[url] || 0;
			totalTime += timeSpentToday; 
		});
		return totalTime;
	},

	convertTabUrlToInternalUrl : function(url){
		var allBlockListUrls = BackGroundManager.blockList;
		var allWhiteListUrls = BackGroundManager.whiteList;
		var result = {};
		
		// the blocked-page url (blocked.html) must be on the whiteList to avoid infinite loops
		// chrome-extension://<random key>/blocked.html#<blocked url>
		if(url !== null && url !== "" && url.search(/^chrome-extension:\/\/.*\/blocked.html#/) != -1) {
			return { match : true, list : 'whiteList', url : url} ;
		}

		resultOrUrl = checkIfInArrayRegExp(url,allWhiteListUrls);
		if(resultOrUrl !== false)
		{
			return { match : true, list : 'whiteList', url : resultOrUrl} ;
		}

		resultOrUrl = checkIfInArrayRegExp(url,allBlockListUrls);
		if(resultOrUrl !== false)
		{
			return { match : true, list : 'blockList', url : resultOrUrl} ;
		}
		else
		{
			return { match : false }; 
		}
		return {match:false};

	},

	shouldUrlBeBlocked : function(url) {
		if(BackGroundManager.checkIfUrlShudBeBlockedNOW(url))
		{
			return true;
		}
		else
		{
			return false;
		}

	},

	getCurrentTabsUrl : function() {
		var url = "";
		url = chrome.tabs.getSelected(null, function (tab){
			if(tab == null)	
				return "";
			return tab.url;
		});
		return url;
	},

	getCurrentTab : function() {
		var curTab = "";
		curTab = chrome.tabs.getSelected(null, function (tab){
			return tab;
		});
		return curTab;
	},

	checkAllWindows : function(windowsArr){
		for (var i = 0; i < windowsArr.length; i++)
		{
			var windowObj = windowsArr[i];
			for (var j = 0; j < windowObj.tabs.length; j++) 
			{
				var tabObj = windowObj.tabs[j];
				var result = BackGroundManager.convertTabUrlToInternalUrl(tabObj.url);
				//In this case, the user tries to open a blocked page during blocked time.
				if(result.match && result.list == 'blockList' && BackGroundManager.shouldUrlBeBlocked(result.url))
				{
					BackGroundManager.blockPage(result.url,tabObj.id);
				}
			}
		}
	},

	activelyBlockPages : function(){
		chrome.windows.getAll( { populate: true }, BackGroundManager.checkAllWindows);
	},

	blockPage : function(url,tabId)
	{
		var modeOfBlocking = BackGroundManager.genOptions.modeOfBlocking;
		if(modeOfBlocking == "redirect" )
		{
			var redirectUrl = BackGroundManager.genOptions.redirectUrl;
			if(!(redirectUrl == null || redirectUrl == ""))
			{
				console.log('redirecting tab id ' + tabId + ' to url : ' + redirectUrl);
				chrome.tabs.update(tabId,{'url':redirectUrl});
				return;
			}
		}

		if(modeOfBlocking == "showblocked" )
		{
			var redirectUrl = chrome.extension.getURL('blocked.html') + '#' + BackGroundManager.currentTabUrl;
			console.log('showing blocked page (' + redirectUrl + ') for tab id ' + tabId);
			chrome.tabs.update(tabId,{'url':redirectUrl});
			return;
		}

		console.log('removing tabid ' + tabId);
		chrome.tabs.remove(tabId);
	},

	increaseHrLtForUrl : function(url, numSecs){
		//Chkif date has rolled over.	
		var dayStr = getDateStr(); 
		var curDateObj = new Date();
		var curHr = curDateObj.getHours();
		var startPeriod = 0;
		var urlDtls = getBlockedUrlDtls(url);
		startPeriod = Math.floor(curHr/urlDtls.maxTimeUnit) * urlDtls.maxTimeUnit;

		if(BackGroundManager.hrLtStats['todayDayStr'] != dayStr)
		{
			BackGroundManager.hrLtStats = {} ;
			BackGroundManager.hrLtStats['todayDayStr'] = dayStr;
		}

		if(BackGroundManager.hrLtStats[url] == null)
		{
			BackGroundManager.hrLtStats[url] = {};
			BackGroundManager.hrLtStats[url]['startPeriod'] = startPeriod;
			BackGroundManager.hrLtStats[url]['numSecs'] = numSecs;
			return;	
		}
		
		//hrLts has some stats for the url
		//	case 1 : time period is same.
		//	case 2 : time period has changed.
		if(BackGroundManager.hrLtStats[url]['startPeriod'] == startPeriod)
		{
			BackGroundManager.hrLtStats[url]['numSecs'] += numSecs;
		}
		else
		{
			BackGroundManager.hrLtStats[url]['startPeriod'] = startPeriod;
			BackGroundManager.hrLtStats[url]['numSecs'] = numSecs;
		}
	},

	increaseTimeForUrl : function(tabDtls,tabId){
		var statHash = BackGroundManager.getStatHashForToday();
		var d = new Date().getTime();

		while(BackGroundManager.isLocked);
		BackGroundManager.isLocked = true;

		//this construct assigns 0 if stathash[tab] = null and d if lastOptime is null
		var numSecs = Math.ceil((d - (tabDtls.lastOpTime || d)) / 1000) ;
		console.log('increased ' + numSecs + ' seconds for url ' + tabDtls.url );
		statHash[tabDtls.url] = (statHash[tabDtls.url] || 0) +   numSecs ;
		tabDtls.lastOpTime = d; 
		
		BackGroundManager.increaseHrLtForUrl(tabDtls.url, numSecs);

		BackGroundManager.tabHash[tabId] = tabDtls;
		BackGroundManager.isLocked = false;
	},

	updateStatistics : function(tabId,result) {

		var d = new Date().getTime();
		var tabDtls = BackGroundManager.tabHash[tabId];

		//it tabDtls is null then it means it is a newly opened tab.
		//Scenario 1 : new tab and url not in block/white list. no need to do anything.
		//Scenario 2 : existing tab and url not in block/white list. prev url has to  be in block/white list 
		//		as else it becomes case 1.
		//Scenario 3 : new tab and url in white/block list 
		//Scenario 4 : existing tab, url in block/white list and prev url also was in block/white list
		//		as else it becomes case 3

		//scenario 1 and 3
		if(tabDtls == null) //newly opened tab. 
		{
			if(result.match)
			{
				BackGroundManager.tabHash[tabId] = { url : result.url, lastOpTime : d };
			}
		}
		else //new page loaded in existing tab
		{
			if(result.match)
			{
				BackGroundManager.increaseTimeForUrl(tabDtls,tabId);
				BackGroundManager.tabHash[tabId] = { url : result.url, lastOpTime : d };
			}
			else
				BackGroundManager.tabHash[tabId] = null;
		}

	},

	updateStatOfOldTab : function(tabId,result){
		var tabDtls = BackGroundManager.tabHash[tabId];

		//If tabDtls is null then it means the prev tab had a non block/white list url and was never stored
		if(tabDtls != null) 
		{
			BackGroundManager.increaseTimeForUrl(tabDtls,tabId);
		}

	},

	blockOrUpdateStats : function(tabId,url){
		if(tabId == null || tabId == "") return;
		if(url == null || url == "") return;

		var result = BackGroundManager.convertTabUrlToInternalUrl(url);
		//In this case, the use tries to open a blocked page during blocked time.
		if(result.match && result.list == 'blockList' && BackGroundManager.shouldUrlBeBlocked(result.url))
		{
			BackGroundManager.blockPage(result.url,tabId);
		}
		else
		{
			BackGroundManager.updateStatistics(tabId,result );
		}
	},

	storeHrLtStats : function(){
		var dayStr = getDateStr(); 
		if(BackGroundManager.hrLtStats['todayDayStr'] != dayStr)
		{
			BackGroundManager.hrLtStats = {} ;
			BackGroundManager.hrLtStats['todayDayStr'] = dayStr;
		}
		localStorage.setItem('hrLtStats', JSON.stringify(BackGroundManager.hrLtStats));
	},

	storeStats : function(){
		//Persist all the stats for today and if the chrome was open across days !
		$.each(BackGroundManager.dayHash, function(day,stats) {
			updateStatsForDay(day,stats);
		});
		BackGroundManager.storeHrLtStats();
	},

	writeToConsole : function(stuff){
		console.log(stuff);
	},


	onTabUpdated : function(tabId,changeInfornamtion,tab)
	{
		//console.log('Tab ' + tabId + ' is updating with url : ' + tab.url + ' and status is ' + changeInfornamtion.status ); 
		//if(changeInfornamtion.status == "complete")
		if(changeInfornamtion.status == "loading")
		{
			if(BackGroundManager.currentTabId != tabId)
			{
				return;
			}
			BackGroundManager.currentTabId = tabId;
			BackGroundManager.currentTabUrl = tab.url;
			BackGroundManager.blockOrUpdateStats(tabId,tab.url);
			BackGroundManager.setTimeOfLastEvent();
		}
	},
	
	onTabSelectionChanged : function(tabId,selectInformation) {
		var result = BackGroundManager.convertTabUrlToInternalUrl(BackGroundManager.currentTabUrl);
		//console.log('on tab selection changed - for tab id ' + BackGroundManager.currentTabId + ' prev url was ' + BackGroundManager.currentTabUrl + ' and gonna update stat for it');
		BackGroundManager.updateStatOfOldTab(BackGroundManager.currentTabId,result);
		BackGroundManager.tabHash[BackGroundManager.currentTabId] = null;

		BackGroundManager.currentTabId = tabId;
		chrome.tabs.get(tabId, function(tab) {
			if(tab == null) return;
			BackGroundManager.currentTabUrl = tab.url;
		//	console.log('on tab selection changed - for tab id ' + BackGroundManager.currentTabId + ' new url is ' + BackGroundManager.currentTabUrl + ' and gonna update stat for it');
			BackGroundManager.blockOrUpdateStats(tabId, BackGroundManager.currentTabUrl);
			BackGroundManager.setTimeOfLastEvent();
		});

	},
	

	onWindowFocusChanged : function(windowId)
	{
		var result = BackGroundManager.convertTabUrlToInternalUrl(BackGroundManager.currentTabUrl);
		
		//console.log('on window focus changed - prev tabid was ' + BackGroundManager.tabId + ' and prev url was ' + BackGroundManager.currentTabUrl + ' and gonna update stat for it');
		BackGroundManager.updateStatOfOldTab(BackGroundManager.currentTabId,result);
		BackGroundManager.tabHash[BackGroundManager.currentTabId] = null;
		if(windowId == -1)
			return;

		chrome.tabs.getSelected(windowId,function(tab){
			if(tab != null)
			{
				BackGroundManager.currentTabId = tab.id;
				BackGroundManager.currentTabUrl = tab.url;
			//	console.log('on window focus change - new tab id is' + BackGroundManager.tabId + ' and new url is ' + BackGroundManager.currentTabUrl + ' and gonna update stat for it');
				BackGroundManager.blockOrUpdateStats(BackGroundManager.currentTabId, BackGroundManager.currentTabUrl);
			}
			BackGroundManager.setTimeOfLastEvent();
		});
	},

	onTabRemoved : function(tabId)
	{
		//console.log('Tab ' + tabId + ' is removed');
		var tabDtls = BackGroundManager.tabHash[tabId];

		//if tab dtls is null then it means the tab's url was not a block/white listed url.
		//	else the url was in block/white list and we need to update the stats
		//console.log('on tab remove for tabid ' + tabId);
		if(tabDtls != null) 
		{
			var statHash = BackGroundManager.getStatHashForToday();
			var d = new Date().getTime();
			var numSecs = Math.ceil((d - (tabDtls.lastOpTime || d)) / 1000 ) ;
			//console.log('tab ' + tabId + ' removed');
			console.log('increased ' + numSecs + ' for url ' + tabDtls.url );
			statHash[tabDtls.url] = (statHash[tabDtls.url] || 0) +  numSecs ;
			BackGroundManager.increaseHrLtForUrl(tabDtls.url, numSecs);
			BackGroundManager.tabHash[tabId] = null;
		}
	},

	onWindowRemoved : function(windowId)
	{
		console.log('window removed - storing all stats');
		BackGroundManager.storeStats();
	}

};

function giggig()
{
	console.log('giggig called');	
	BackGroundManager.intervalTimerId4 = setTimeOut('BackGroundManager.giggig()', BackGroundManager.inactiveTimerInterval);
}
