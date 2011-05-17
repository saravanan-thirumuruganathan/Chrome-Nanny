function checkIfInArray(needle,hay,ignoreCase)
{
	if(needle == null)
		return false;
	if(ignoreCase == null)
		ignoreCase = false;
	if(ignoreCase)
		needle = needle.toLowerCase();

	var curKey = null;
	for(var index in hay)
	{
		curKey = hay[index];
		if(curKey == null)
			continue;
		if(ignoreCase)
			curKey = curKey.toLowerCase();

		if (curKey == needle)
			return true;
	}
	return false;
}

function stripProtocols(url)
{
	url_ = url; //HH
	url_ = url_.replace("https://","");
	url_ = url_.replace("http://","");
	url_ = url_.replace("www.","");
	return url_;
}

function checkIfInArrayRegExp(needle,hay)
{
	if(needle == null)
		return false;

	needle = stripProtocols(needle.toLowerCase());

	var curKey = null;
	for(var index in hay)
	{
		curKey = hay[index];
		if(curKey == null)
			continue;
		curKey = stripProtocols(curKey.toLowerCase());
		if (new RegExp(curKey).exec(needle) != null)
		{
			return hay[index];
		}
	}
	return false;
}

function removeElementFromArray(needle,hay,ignoreCase)
{
	/*if(needle == null)
		return false;
	*/
	if(ignoreCase == null)
		ignoreCase = false;
	if(ignoreCase)
		needle = needle.toLowerCase();

	var curKey = null;
	var newArray = [];
	for(var index in hay)
	{
		curKey = hay[index];
		if(curKey == null)
			continue;
		if(ignoreCase)
			curKey = curKey.toLowerCase();
		if (curKey != needle)
			newArray.push(hay[index]);
	}
	return newArray;
}

function isNumeric(n)
{
	//courtesy : http://stackoverflow.com/questions/18082/validate-numbers-in-javascript-isnumeric
	return !isNaN(parseFloat(n)) && isFinite(n);
}

function isValidMinuteInterval(n)
{
	if(!isNumeric(n))
		return false;
	n = parseFloat(n);
	if(n < 0 || n > 1440)
	       return false;
	return true;	
}

//Idea taken from Leechblock's implementation.
function isValidTimeBlock(timeBlock)
{
	if(timeBlock == null)
		return false;
	return /^\d\d\d\d-\d\d\d\d([, ]+\d\d\d\d-\d\d\d\d)*$/.test(timeBlock);
}

//Idea taken from Leechblock's LeechBlock_getMinPeriods function 
//	returns [] if invalid input is given
function convertTimePeriodStrToArray(times)
{
	var minPeriods = [];
	if(times == "" || times == null)
		return minPeriods;
	var regexpObj = /^(\d\d)(\d\d)-(\d\d)(\d\d)$/;
	var periods = times.split(/[, ]+/);
	var results, start, end,minPeriod;

	for (var i = 0 ; i < periods.length; i++) 
	{
		results = regexpObj.exec(periods[i]);
		if(results == null) return [];
		results =  results.map(function(k){ return parseInt(k,10) ; });

		//exec returns four information - matched string and the backreferences and 
		// hence indices start from 1 for the actual hh,mm data
		if(results[1] > 23 || results[3] > 23)
			return [];
		if(results[2] > 59 || results[4] > 59)
			return [];
		start = results[1] * 60  + results[2];
		end = results[3] * 60  + results[4];
		if(start > end)
			return []; 
		minPeriod = {
			start : start, 
			end : end
		};
		minPeriods.push(minPeriod);
	}
	return minPeriods;
}

function convertTimePeriodArrToStr(arr)
{
	if(arr == "" || arr == null || arr.length == 0)
		return "";
	str = "";
	var period,hr,min;
	for(var i in arr)		
	{
		period = arr[i];

		hr = Math.floor(period.start/60) ; hr = (hr < 10) ? "0" + hr : hr; 
		min = period.start % 60; min = (min < 10) ? "0"+min : min;

		if(str != "")
			str = str + ",";
		str = str + hr + min;
		
		hr = Math.floor(period.end/60) ; hr = (hr < 10) ? "0" + hr : hr; 
		min = period.end% 60; min = (min < 10) ? "0"+min : min;

		str = str + "-" + hr + min;
	}
	return str;
}

function appendItemToUl(ulFieldId,tagName)
{
	$(ulFieldId).append("<li>"+ tagName + "</li>");
}

function getAllLiInUl(ulFieldId)
{
	var allLi = [];
	$(ulFieldId).find('li').each(function(index) {allLi.push($(this).text()) });
	return allLi;
}

function addTagsToUl(ulFieldId,tagArr)
{
	if(ulFieldId == null || tagArr == null)
		return;
	$(ulFieldId).html("");
	$.each(tagArr,function(key,value) { $(ulFieldId).append("<li>"+value+"</li>")});
}

function getDateStr(d)
{
	if(d == null)
		d = new Date();
	return (d.getMonth() + 1 ) + "-" + d.getDate() + "-" + d.getFullYear() ;
}

Date.prototype.addMonths = function(n)
{
	this.setMonth(this.getMonth()+n);
		return this;
}

Date.prototype.addDays = function(n)
{
	this.setDate(this.getDate()+n);
		return this;
}

function convertMinToHrMinStr(min)
{
	//=== is needed => else 0 is considered as null
	if(min === null || min === "" )
		return "";
	var hr = Math.floor(min/60);
	if(hr <= 9)
		hr = "0" + hr;
	min = min % 60;
	if(min <=9)
		min = "0" + min;
	return ("" + hr + ":" + min);
}

function convertMinToHrMinStrLong(min)
{
	//=== is needed => else 0 is considered as null
	var minStr = "";
	if(min === null || min === "" )
		return "";

	if(min <= 59)
		minStr =  min + " minutes ";
	else
		minStr = convertMinToHrMinStr(min) + " hours ";
	return minStr;
}

function convertDayNumToDayStr(days)
{
	if(days == null )
		return "";

        var weekDayNum= new Array("0","1","2","3","4","5","6");
        var weekDayNames= new Array("Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday");
	$.each(weekDayNum, function(index,dayNum){
		days = days.replace(dayNum, weekDayNames[index]);
	});
	return days;
}

function getNumElemsInHash(hash)
{
	if(hash == null)
		return 0;
	var num = 0;
	$.each(hash,function(k,v){num++;});
	return num;
}

function getRandomStr()
{
	//http://stackoverflow.com/questions/1349404/generate-a-string-of-5-random-characters-in-javascript
	// also ignore l,1,I and 0 as per leechblock's idea.
	
	var text = "";
	var alphaNum = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789";
	var curGenOptions = getGeneralOptions();
	var challengeLen = parseInt(curGenOptions.challengeLen);

	for( var i=0; i < challengeLen; i++ )
		text += alphaNum.charAt(Math.floor(Math.random() * alphaNum.length));
	return text;
}


function replaceElemInArray(arrayObj,searchTxt,replaceTxt)
{
	var newArray = [];
	if(!$.isArray(arrayObj) || searchTxt == null || replaceTxt == null  )
		return newArray;

	newArray = $.map(arrayObj, function(val) { return ((val == searchTxt) ? replaceTxt : val);} );
	return newArray;
}
