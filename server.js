"use strict";
let	jsforce = require('jsforce');
var schedule = require('node-schedule');
var conn = new jsforce.Connection();
var username = process.env.SF_USERNAME;
var password = process.env.SF_PASSWORD;
var Users = [];
var arraye = [];
var emailC = [];
var email = function(){};
var currentUser = '';
var res1 = '';
var res2 = '';

function init(){
 Users = [];
 arraye = [];
 emailC = [];
 currentUser = '';
 res1 = '';
 res2 = '';
}

console.log('App started running, please wait for scheduler to run.');
var ns = schedule.scheduleJob(process.env.SCHEDULE_CORN_EXP , function(){
	console.log("Last modified on 27th Dec!!!");	
	console.log('Scheduler started running!!!!');
	conn = new jsforce.Connection({
		loginUrl : process.env.SF_LOGIN_URL
	});
	conn.login(username, password, function(err, userInfo) {
		if (err) { return console.error(err); }
		conn.apex.get(process.env.SF_WEBSERVICE_FIRST , function(err, resp) {
		//Fetching Followers
			if(err) { return console.log(err); }
			else {
				res1 = JSON.parse(JSON.parse(JSON.stringify(resp)));
				console.log('No of Userss:>>>',res1.length);
				for (var count=0; count < res1.length; count++) {
				console.log('users>>>>>',count);
				Users.push(res1[count].Id);
				}
				if( Users.length > 0 )
				followerCaller(Users[0]);
		    }
		});
	});
});

var followerCaller = function(id) {
	currentUser = id;
	//Fetching Articles
	conn.apex.get(process.env.SF_WEBSERVICE_SECOND + id , FollowerHandler);
}

var FollowerHandler = function(err, resp2){
	res2 = JSON.parse(JSON.parse(JSON.stringify(resp2)));
	let dupID = currentUser;
	Users.splice(Users.indexOf(currentUser), 1);
	if(res2){
		console.log('No of articles>>>>>',res2.lstArticle.length);
		let emailContent = '';
		if(res2.lstArticle.length > 59)
		 	res2.lstArticle.length = 62 ;
		for (let i=0; i < res2.lstArticle.length; i++) {
			emailContent+= '<p><a href="' + process.env.SF_DOMAIN + 
			res2.lstArticle[i].parentId + '">' + res2.lstArticle[i].Title + '</a></p>';
			if(i == (res2.lstArticle.length)-1 ){
				email(res2.Email, res2.FirstName , emailContent , Users.length , dupID);
			}
		}
	}
	else{
		console.log('No articles found!!!');
	}
}

const sgMail = require('@sendgrid/mail');

var email = function(toEmail, FirstN , emailC , UsersLen , dupID){
	console.log('First name : ',FirstN);
	sgMail.setApiKey(process.env.SENDGRID_API_KEY);
	sgMail.setSubstitutionWrappers('{{', '}}');
	if(process.env.SENDGRID_EMAIL_NOTIFICATION != 'TRUE'){
		toEmail = process.env.SENDGRID_EMAIL_NOTIFICATION ;
	}
	const msg = 
		{
			to: toEmail, 
			from: process.env.SENDGRID_FROM_EMAIL,
			subject: process.env.SENDGRID_EMAIL_SUBJECT,
			templateId: process.env.SENDGRID_TEMPLATE_ID,
			substitutions: {
			name : FirstN,
			links : emailC,
			},
		};
	arraye.push(msg);
	if( UsersLen > 0 ) {
		followerCaller( Users[0] );
	}
	if( UsersLen == 0){
		msgSend(arraye,FirstN);
	}
}

var msgSend = function(msgArraye,fName){
	console.log('single call!!!!');
	sgMail.send(msgArraye , function(err,json){
		if(err){
		  return console.error(err);
		}
		else {
			// console.log(json);
			console.log('Email Sent to ',fName);
		}
		init();
	}); 
}