// Load the http module to create an http server.
var http = require('http');
var express = require('express');
var OAuth = require('oauth');
var _ = require('underscore');
var crypto= require('crypto');
var request = require('request');
var redis   = require('redis');
var Backbone = require('backbone');


console.log(JSON);
JSON.copy = function(o) { return JSON.parse(JSON.stringify(o)); }
console.log(JSON);

myOAuth = function(secrets) {
	this.secrets = secrets;
};

myOAuth.prototype.getQuery = function(url, param) {
	this.genParams();
	url = 'https://stream.twitter.com/1.1/statuses/filter.json';
	queryParams = {
		//'track' : 'party'//'storm,lightning,rainfall,flood'//,
		'locations' : '-179,-89,179,89'
	}	
	console.log(this._normaliseRequestParams(_.extend(JSON.copy(this.params), queryParams)));

	var signatureBase = 'GET&https%3A%2F%2Fstream.twitter.com%2F1.1%2Fstatuses%2Ffilter.json&locations%3D-179%252C-89%252C179%252C89%26oauth_consumer_key%3DGV0aHbfIFLmrioHFxKgXEbPId%26oauth_nonce%3D6a1b6f2735d1419d633f4de92ab38a7d%26oauth_signature_method%3DHMAC-SHA1%26oauth_timestamp%3D1431285314%26oauth_token%3D3245017343-H8FjkrGFB9UGxnOdNwIAi9rcPwOZn2CBsfaTL8r%26oauth_version%3D1.0%26track%3Dfire';
	sigBase = this._genSignatureBase('GET',url , _.extend(JSON.copy(this.params), queryParams));

	console.log('Nonce:');
	console.log(this.params.oauth_nonce);
	console.log('Sig. base:');
	console.log(sigBase);
	console.log('Wzorzec:');
	console.log(signatureBase);
	console.log(sigBase == signatureBase);

	signingKey = this._encodeData(this.secrets.appSecret) + '&' + this._encodeData(this.secrets.userSecret);

	var signatureHash;
	hasher = crypto.createHmac("sha1", signingKey);
	hasher.setEncoding('base64');
	hasher.write(sigBase);
	hasher.end();
	signatureHash = hasher.read();

	console.log('!!!');
	console.log(signingKey);
	console.log('!!!');
	console.log(signatureHash);

	var headerParams = _.extend({'oauth_signature' : signatureHash}, JSON.copy(this.params));
	var header = "OAuth ";
	_.each(headerParams, function(v,k) {
		header += this._encodeData(k) + '="' + this._encodeData(v) + '", ';
	}, this);
	header.substr(0, header.length-2);
	console.log('Header: ');
	console.log(header);

	// dodac poprawne sortownie(po kluczu), bo '=' < 'a'
	paramsString = _.sortBy(_.map(queryParams, function(v,k) {
		return k + '=' + this._encodeData(v);
	}, this), function(s) {return s;}, this).join('&');

	console.log('Params string');
	console.log(paramsString);
	console.log("\n\n\n\n");	
	console.log("curl --get '" + url + "' --data '" + paramsString + "' --header 'Authorization: " + header + "' --verbose");	
	return {
		'url' : url,
		'queryParams' : paramsString,
		'header' : header
	};	
}



myOAuth.prototype.genParams = function() {
	this.params = {	
		'oauth_consumer_key' : this.secrets.appToken,
		'oauth_nonce' : moa._getNonce(),	
		'oauth_signature_method' : "HMAC-SHA1", 
		'oauth_timestamp' : Math.floor(_.now()/1000) - 10,//"1431299655"
		'oauth_token' : this.secrets.userToken,	
		'oauth_version' : "1.0"
	}
}

myOAuth.prototype._encodeData= function(toEncode){
	if( toEncode == null || toEncode == "" ) return ""
	else {
		var result= encodeURIComponent(toEncode);
		// Fix the mismatch between OAuth's RFC3986's and Javascript's beliefs in what is right and wrong ;)
		return result.replace(/\!/g, "%21")
			.replace(/\'/g, "%27")
			.replace(/\(/g, "%28")
			.replace(/\)/g, "%29")
			.replace(/\*/g, "%2A");
	}
}

// Takes an object literal that represents the arguments, and returns an array
// of argument/value pairs.
myOAuth.prototype._makeArrayOfArgumentsHash= function(argumentsHash) {
	var argument_pairs= [];
	for(var key in argumentsHash ) {
		if (argumentsHash.hasOwnProperty(key)) {
			var value= argumentsHash[key];
			if(Array.isArray(value) ) {
				for(var i=0;i<value.length;i++) {
					argument_pairs[argument_pairs.length]= [key, value[i]];
				}
			} else {
				argument_pairs[argument_pairs.length]= [key, value];
			}
		}
	}
	return argument_pairs;
}

myOAuth.prototype._sortRequestParams= function(argument_pairs) {
	// Sort by name, then value.
	argument_pairs.sort(function(a,b) {
		if ( a[0]== b[0] ) {
			return a[1] < b[1] ? -1 : 1;
		}
		else {
			return a[0] < b[0] ? -1 : 1;
		}
	});
	return argument_pairs;
}

myOAuth.prototype._normaliseRequestParams= function(args) {
	var argument_pairs= this._makeArrayOfArgumentsHash(args);
	// First encode them #3.4.1.3.2 .1
	for(var i=0;i<argument_pairs.length;i++) {
		argument_pairs[i][0]= this._encodeData(argument_pairs[i][0]);
		argument_pairs[i][1]= this._encodeData(argument_pairs[i][1]);
	}
	// Then sort them #3.4.1.3.2 .2
	argument_pairs= this._sortRequestParams( argument_pairs );
	// Then concatenate together #3.4.1.3.2 .3 & .4
	var args= "";
	for(var i=0;i<argument_pairs.length;i++) {
		args+= argument_pairs[i][0];
		args+= "="
		args+= argument_pairs[i][1];
		if( i < argument_pairs.length-1 ) args+= "&";
	}
	return args;
}

myOAuth.prototype._genSignatureBase = function(method, url, params) {
	var res = method + '&';
	res += this._encodeData(url) + '&';
	res += this._encodeData(this._normaliseRequestParams(params));
	return res;	
}

myOAuth.prototype.NONCE_CHARS= ['a','b','c','d','e','f','g','h','i','j','k','l','m','n',
'o','p','q','r','s','t','u','v','w','x','y','z','A','B',
'C','D','E','F','G','H','I','J','K','L','M','N','O','P',
'Q','R','S','T','U','V','W','X','Y','Z','0','1','2','3',
'4','5','6','7','8','9'];
myOAuth.prototype._getNonce = function() {	
	return _.map(_.range(32), function(v) { return _.sample(this.NONCE_CHARS);}, this).join('');
} 


var CRegexps = function() {
	this.tab = {};
	this.regexp = new RegExp('', 'i');
	// pusty this.tab powinien odfiltrowywac wszystko
	this.add('dtsaftyfudasbu', 'dhhjkdskgkgasd');
};
CRegexps.prototype = {
	'add' : function(name, regexp) {
		var dummyE;
		try {
			new RegExp(regexp);
			this.tab[name] = regexp;
			this.genFull();
		} catch(dummyE) {
			console.log('Niepoprawny regexp');
		}
	},
	'remove' : function(name) {
		delete(this.tab[name]);
		this.genFull();
	},
	'genFull' : function() {
		var regexp = '', i=0;
		_.each(this.tab, function(lregexp) {
			//console.log(regexp, i, lregexp);
			regexp = regexp + (i>0 ? '|' : '') + '(' + lregexp + ')';
			i++;
		});
		this.regexp = new RegExp(regexp, 'i');
	}
};


var moa = new myOAuth({
	'appToken' : 'GV0aHbfIFLmrioHFxKgXEbPId',
	'appSecret' : 'fPlb3AWkozvP38MzKF8yzoZTyvJ0OTUb69LS3ePwK2VsELF6wm',
	'userToken' : '3245017343-H8FjkrGFB9UGxnOdNwIAi9rcPwOZn2CBsfaTL8r',
	'userSecret' : 'y8fEdVhy5kqXjoINpkpPuzc9OjGOQPJ03hWwY076jhvTZ'
});

var globregexps = new CRegexps();




var ctrl = _.extend({}, Backbone.Events);
var twitterReq = null;
var reconnectTimeout = 10000;

// connect to twitter stream
var connectToTwitter = function() {	
	var jsonsNo = 0, jsonsNo2;
	var twitterReq = null, query, interval;
	console.log('connecting to twitter stream');
	query = moa.getQuery();
	console.log(moa.getQuery());
	console.log("---\n---\n---\n---");
	
	twitterReq = request({
		url : query.url + '?' + query.queryParams,
		headers : {
			'Authorization' : query.header
		},
		gzip :false
		
	});
	twitterReq.on('response', function(response) {			
		var e;
		response.setEncoding('utf8');
		console.log(response.statusCode) // 200
		console.log(response.headers['content-type']) // 'image/png'
		console.log(response.headers) // 'image/png'
		//console.log(response);
		var data = '';
		response.on('data', function (chunk) {
			var pos, json;
			reconnectTimeout = 10000;
			data+=chunk;
			pos = data.search("\r\n");
			//console.log(data.length, data.search("\r\n"), data.search("\r\n"), pos);
			json = data.substr(0,pos);
			data = data.substr((pos >=0 ? pos+2 : 0), data.length);		
			//console.log(' >', data.length, data.search("\r\n"), data.search("\r\n"), pos);
			if (!!json) {
				//console.log(json.length);
				//console.log(data.length, json.length);
				try{		
					jsonsNo++;								
					//console.log(JSON.stringify(jsonObj, null, '\t'));
					if (globregexps.regexp.test(json)) {						
						jsonObj = JSON.parse(json);				
						ctrl.trigger('newData', jsonObj);					
					} else {						
						if(jsonsNo % 100 == 0) {
							console.log('Odebrano ' + jsonsNo);
						}					
					}
					//processStatus(json);						
				} catch(e){					
					console.log('not json');
				}			
			}
			
			//console.log(data);		
		});
	});
	twitterReq.on('end', function(err) {
		console.log('END');
		console.log(err);		
	});
	twitterReq.on('error', function(err) {
		console.log('ERROR:');
		console.log(err);
	});
	interval = setInterval((function() {
		return function() {
			console.log('interval', jsonsNo, jsonsNo2);
			if(jsonsNo === jsonsNo2 || jsonsNo === 0) {
				console.log('aborted twitterReq');
				twitterReq.abort();
				clearTimeout(interval);				
				setTimeout(function() {
					connectToTwitter();
				}, reconnectTimeout);
				reconnectTimeout *= 2; 
				//delete(twitterReq);
				//console.log(twitterReq);
			}			
			jsonsNo2 = jsonsNo;
		};
	})(), 5000);
	
}
if (true) {	
	connectToTwitter();
}





// Listen on port 8000, IP defaults to 127.0.0.1
//server.listen(8000);
var app = express(), stream=null;

app.get('/stream/:phrase/:exclude', function (request, response) {	
	var dummyE, regexp;
	var phrase = request.param("phrase");
	var exclude = request.param("exclude") || 'asdfghnjchisfgbdsi';
	var streamWritter;
	var requestId = _.uniqueId();
	var resNo = 0;	
	var closeConnection;
	phrase = phrase || "new\s*york";
	//phrase = phrase || /london/i;	
	regexp = new RegExp(phrase, 'i');
	exclude = new RegExp(exclude, 'i');
	
	request.socket.setTimeout(Infinity);
	response.writeHead(200, {
		"Content-Type": "text/event-stream", 
		'Access-Control-Allow-Origin': '*',
		'Cache-Control': 'no-cache',
		'Connection': 'keep-alive' 
	});		
	
	response.write('\n');
	globregexps.add(requestId, phrase);
	console.log('Otwarto połączenie z ' + regexp + ' : ' +exclude);	
	console.log('globregexp ' + globregexps.regexp.toString());	
	
	closeConnection = function() {
		console.log('Zamknięto połączenie z ' + phrase + ' : ' +exclude);
		globregexps.remove(requestId);
		ctrl.off('newData', streamWritter);
	}
	// TODO!!! usuwanie listenera po odlaczeniu sie klienta od streama
	streamWritter = function(json) {
		var dummyE;		
		//response.write('data: ' + mes + '\n\n');
		//console.log('!!!');
		//console.log(regexp.test(mes), regexp);
		if (resNo > 1000) {
			response.write('event: error\n');
			response.write('data: More than 1000 msgs connot be recived in one session.\n\n');
			closeConnection();
			return;
		}
		try {
			if (regexp.test(json.text) && !exclude.test(json.text)) {
				resNo++;
				response.write('data: ' + JSON.stringify(json) + '\n\n');
				console.log('--');
				console.log(json.text);
			} else if (false) {
				response.write('data: ' + JSON.stringify({
					'place' : json.place,
					'isBlank' : true
				}) + '\n\n');
			}
		} catch(dummyE) {
		}
	};
	ctrl.on('newData', streamWritter);
	
	request.connection.on('close', function() {
		closeConnection();
	});
	
	//response.end("Hello World\n");
});

app.get('/write/', function (request, response) {
	response.writeHead(200, {
		"Content-Type": "text/html", 		
	});			
	response.end("Write\n");
	ctrl.trigger('newData', 'hejho');
});
app.use(express.static(__dirname + '/client'));
app.listen(8000, process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1');
// Put a friendly message on the terminal
console.log("Server running at 8000/");
