var counter=0;
var newNotif=false;
var deskNoti=null;
var showNoti=true;
var timeNoti=20000;
var timerVar=null;
var timerDelay=300000;
var playSound=true;
var audio=new Audio('ding.ogg');
window.onload=init;

var BADGE_NEW={color:[0,204,51,255]};
var BADGE_ACTIVE={color:[204,0,51,255]};
var BADGE_LOADING={color:[204,204,51,255]};
var BADGE_INACTIVE={color:[153,153,153,255]};

function loadData(){
	var xhr=new XMLHttpRequest();
	xhr.open('GET','http://www.facebook.com/home.php',true);
	xhr.onreadystatechange=function(){
		if(xhr.readyState==4){
			chrome.browserAction.setBadgeBackgroundColor(BADGE_INACTIVE);

			var xmlDoc=xhr.responseText;
			var fUser='';
			var loc=xmlDoc.indexOf('_2dpb');
			if(loc>0){
				var myString=xmlDoc.substr(loc,120);
				fUser=myString.substring(myString.indexOf('>')+1,myString.indexOf('<'));
			}
			else if(xmlDoc.indexOf('headerTinymanName')>0){
				loc=xmlDoc.indexOf('headerTinymanName');
				var myString=xmlDoc.substr(loc,120);
				fUser=myString.substring(myString.indexOf('>')+1,myString.indexOf('<'));
			}

			if(fUser){
				var lastCounter=counter;

				// Message Value
				loc=xmlDoc.indexOf('messagesCountValue');
				if(loc>0){
					var myString=xmlDoc.substr(loc,80);
					counter=parseInt(myString.substring(myString.indexOf('>')+1,myString.indexOf('<')),10);
				}

				var badgeTitle='Messenger.com - '+fUser;
				if(counter>0) badgeTitle+='\n> '+counter+' Messages';

				chrome.browserAction.setIcon({path:'icon.png'});
				chrome.browserAction.setTitle({title:badgeTitle});
				if(counter==0)chrome.browserAction.setBadgeText({text:''});
				else chrome.browserAction.setBadgeText({text:counter});
				if(counter>lastCounter){
					newNotif=true;
					if(playSound)audio.play();
					if(showNoti){
						if(deskNoti)deskNoti.cancel();
						deskNoti=webkitNotifications.createNotification('icon48.png','Messenger.com Checker','You have '+counter+' new messages');
						deskNoti.onclick=function(){openPage();this.cancel()};
						deskNoti.show();
						if(timeNoti){window.setTimeout(function(){deskNoti.cancel();},timeNoti);}
					}
				}
				if(newNotif)chrome.browserAction.setBadgeBackgroundColor(BADGE_NEW);
				else if(counter>0)chrome.browserAction.setBadgeBackgroundColor(BADGE_ACTIVE);
			}
			else{
				chrome.browserAction.setIcon({path:'icon-.png'});
				chrome.browserAction.setTitle({title:'--Disconnected--'});
				chrome.browserAction.setBadgeText({text:'?'});
				return;
			}
		}
		else return;
	}
	xhr.send(null);
	window.clearTimeout(timerVar);
	timerVar=window.setTimeout(loadData,timerDelay);
}

function init(){
	playSound=(localStorage.playSound)?(localStorage.playSound=='yes'):true;
	showNoti=(localStorage.showNoti)?(localStorage.showNoti=='yes'):true;
	timeNoti=parseInt(localStorage.timeNoti||'20000',10);
	timerDelay=parseInt(localStorage.refreshInterval||'300000',10);

	chrome.browserAction.setIcon({path:'icon-.png'});
	chrome.browserAction.setBadgeText({text:'...'});
	chrome.browserAction.setBadgeBackgroundColor(BADGE_LOADING);
	loadData();
}

function tabCallback(tab){
	chrome.tabs.onRemoved.addListener(function(tabId){if(tabId==tab.id)loadData();});
	chrome.windows.update(tab.windowId,{focused:true});
}

function openUrl(uri){
	chrome.windows.getAll({populate:true},function(windows){
		if(windows.length<1){
			chrome.windows.create({url:uri,focused:true});
			return;
		}
		chrome.tabs.getSelected(null,function(tab){
			if(tab.url=='chrome://newtab/')
				chrome.tabs.update(tab.id,{url:uri},tabCallback);
			else
				chrome.tabs.create({url:uri},tabCallback);
		});
	});
}

function openPage(){
	openUrl("https://www.messenger.com");
	newNotif=false;
	loadData();
}

chrome.browserAction.onClicked.addListener(function(tab){
	openPage();
});
