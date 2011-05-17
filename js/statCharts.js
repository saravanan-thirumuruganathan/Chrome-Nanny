function validateChartDateRanges()
{
	var from = $("#from").val();
	var to = $("#to").val();

	if(from == "" || to == "" )
	{
		$("#from").focus();
		alert('Please select a valid date range to plot !');
		return false;
	}

	var fromDate = new Date(from).getTime();
	if(isNaN(fromDate))
	{
		$("#from").focus();
		alert('Invalid format for From Date : Please enter in mm-dd-yyyy format or use the date picker');
		return false;
	}	

	var toDate = new Date(to).getTime();
	if(isNaN(toDate))
	{
		$("#to").focus();
		alert('Invalid format for To Date : Please enter in mm-dd-yyyy format or use the date picker');
		return false;
	}	

	if(fromDate > toDate)
	{
		$("#from").focus();
		alert('FromDate should be before To Date');
		return false;
	}

	return true;
}

function doChartPreProcessing(dayStats,urlList,chartDiv,chartType)
{
	var urlStatArr = [];
	var nonZeroUrls = [];
	var urlVal = 0;
	var numNonZeroElems = 1; 

	$('#' + chartDiv).html("");

	$.each(urlList, function(index,url){
		urlVal = (dayStats[url] == null) ? 0 : dayStats[url] ;
		urlVal = Math.ceil(urlVal / 60 )
		if(urlVal > 0)
		{
			url = url + "&nbsp;(" + convertMinToHrMinStr(urlVal) + ")";

			if(chartType == 'B')
				urlStatArr.push([urlVal,numNonZeroElems++]); 
			else
				urlStatArr.push([url,urlVal]); 

			nonZeroUrls.push(url);
		}
	});

	if(nonZeroUrls.length == 0)
	{
		$("#" + chartDiv).hide();
		return {} ;
	}
	else
	{
		$("#" + chartDiv).show();
	}

	return { stats : urlStatArr, urls : nonZeroUrls} ;
}

function plotPieChart(dayStats,urlList,chartDiv,chartTitle)
{
	var result = doChartPreProcessing(dayStats,urlList,chartDiv,'P');
	var numElemsInHash = getNumElemsInHash(result);
	if(numElemsInHash == 0)
		return;

	var urlStatArr = result.stats;
	var nonZeroUrls = result.urls;
	$.jqplot(chartDiv, [urlStatArr], {
    		title: chartTitle,
    		seriesDefaults:{renderer:$.jqplot.PieRenderer},
		legend:{show:true}
	});

}


function plotHorizontalBarGraph(dayStats,urlList, chartDiv, chartTitle)
{
	var result = doChartPreProcessing(dayStats,urlList,chartDiv,'B');
	var numElemsInHash = getNumElemsInHash(result);
	if(numElemsInHash == 0)
		return;
	
	var urlStatArr = result.stats;
	var nonZeroUrls = result.urls;
	
	$.jqplot(chartDiv, [urlStatArr], {
		title: chartTitle,
		seriesDefaults:{
			renderer:$.jqplot.BarRenderer, 
			rendererOptions:{barDirection:'horizontal', barPadding: 6, barMargin:15}, 
			},

		series:[ {label:'', renderer:$.jqplot.BarRenderer} ],
		axes:{
			xaxis:{min:0},
			yaxis:{	
				renderer:$.jqplot.CategoryAxisRenderer,
				ticks : nonZeroUrls
			}
	    	}
	});

}

function plotChartForBlockList(dayStats,chartType)
{
	var allBlockListUrls = chrome.extension.getBackgroundPage().BackGroundManager.blockList;
	if(chartType == 'B')
		plotHorizontalBarGraph(dayStats,allBlockListUrls, 'blockListChart', 'Chart of Blocked URLs (time in hh:mm)');
	else
		plotPieChart(dayStats,allBlockListUrls, 'blockListChart', 'Chart of Blocked URLs (time in hh:mm)');
}

function plotChartForWhiteList(dayStats,chartType)
{
	var allWhiteListUrls = chrome.extension.getBackgroundPage().BackGroundManager.whiteList; 
	if(chartType == 'B')
		plotHorizontalBarGraph(dayStats,allWhiteListUrls, 'whiteListChart', 'Chart of White Listed URLs (time in hh:mm)');
	else
		plotPieChart(dayStats,allWhiteListUrls, 'whiteListChart', 'Chart of White Listed URLs (time in hh:mm)');
}

function plotChartForTags(dayStats,chartType)
{
	var allTags = chrome.extension.getBackgroundPage().BackGroundManager.tags; 
	var blockListDtls = chrome.extension.getBackgroundPage().BackGroundManager.blockListDtls; 
	var allWhiteListUrls = chrome.extension.getBackgroundPage().BackGroundManager.whiteList; 

	var tagToTime = {};

	$.each(allTags, function(index,tagName){
		var allUrlsInTag = getUrlsForTag(tagName);
		var tagSum = 0 ; 

		$.each(allUrlsInTag, function(urlIndex,url){
			//Url can be either a white listed url or a block set
			if(checkIfInArray(url,allWhiteListUrls))
				tagSum = tagSum + (dayStats[url] || 0);
			else
			{
				var blockSetDtls = getBlockSetDtls(url);
				if(blockSetDtls.urls != null)
				{
					$.each(blockSetDtls.urls, function(urlIndex2, url) {
						tagSum = tagSum + (dayStats[url] || 0);
					});
				}
			}
		});
		tagToTime[tagName] = tagSum;
	});

	if(chartType == 'B')
		plotHorizontalBarGraph(tagToTime, allTags, 'tagChart', 'Chart of All Tags (time in hh:mm)');
	else
		plotPieChart(tagToTime, allTags, 'tagChart', 'Chart of All Tags (time in hh:mm)');
}

function plotChartForBlockSets(dayRangeStats,chartType)
{
	var allBlockSets = getAllBlockSets();
	var blockSetStats = {};
	var blockSetTotalTime = 0; 
	var allBlockSetNames = []; //a new array is needed as block set's internal name is unreadable.
	var blockSetName = "";

	$.each(allBlockSets, function(blockSetIndex, blockSetInternalName){
		var blockSetDtls = getBlockSetDtls(blockSetInternalName);
		blockSetName = blockSetDtls.name;
		blockSetTotalTime = 0;
		if(blockSetDtls.urls != null)
		{
			$.each(blockSetDtls.urls, function(urlIndex, url){
				blockSetTotalTime = blockSetTotalTime + (dayRangeStats[url] || 0);
			});
		}
		blockSetStats[blockSetName] = blockSetTotalTime;
		allBlockSetNames.push(blockSetName);
	});

	if(chartType == 'B')
		plotHorizontalBarGraph(blockSetStats, allBlockSetNames, 'blockSetChart', 'Chart of BlockSet Stats(time in hh:mm)');
	else
		plotPieChart(blockSetStats, allBlockSetNames, 'blockSetChart', 'Chart of BlockSet Stats (time in hh:mm)');
}

function plotCharts()
{
	if(!validateChartDateRanges())
		return;

	var dayStats = getStatsForDateRange($("#from").val() , $("#to").val());
	var chartType = $("input[name='chartType']:checked").val(); 
	
	var numUrls = getNumElemsInHash(dayStats);
	if(numUrls == 0)
	{
		alert('No data to chart for the given interval');
		return;
	}
	plotChartForBlockList(dayStats,chartType);
	plotChartForWhiteList(dayStats,chartType);
	plotChartForTags(dayStats,chartType);
	plotChartForBlockSets(dayStats,chartType);
}
