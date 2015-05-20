var CRegexps = function() {
	this.tab = {};
	this.regexp = new RegExp('', 'i');
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

findCenter = function () {
	var points = app.points.toJSON();
	var l1, mean = [0,0], wSum, delay = 500;						
	var pointsMap = {};
	var hash = function(point) {
		return point.lon + ':' + point.lat;
	}
	if (app.map.cursor && app.map.cursor.x) {
		mean = [app.map.cursor.x,app.map.cursor.y];
	}
	// dodajemy do punktu ilosc tweetow z tych samych wspolrzednych
	points = _.each(points, function(p) {				
		if (!pointsMap[hash(p)]) {
			pointsMap[hash(p)] = 0;
		}
		pointsMap[hash(p)] += 1;				
	});
	points = _.each(points, function(p) {				
		p.tweetsNo = pointsMap[hash(p)];
	});
	for (l1 = 0; l1 < 20; l1++) {				
		wSum = 0;								
		_.each(points, function(p) {
			p.w = 1/(Math.pow(_.geoDist(p.lon, p.lat,mean[0], mean[1]),1.5)+1.0)/Math.pow(p.tweetsNo, 0.6);				
			//console.log(mean[0],mean[1],p.lon, p.lat, p.w, p.tweetsNo);
			wSum += p.w;
		});				
		_.each(points, function(p) {
			p.w = p.w/wSum;														
		});					
		mean=[0,0];
		_.each(points, function(p) {
			mean[0] += p.lon*p.w;
			mean[1] += p.lat*p.w;					
		});	
		_.each(points, function(p) {					
		});					
		//console.log('-------');										
		app.map.setCursor(mean[0], mean[1]);
		/*setTimeout((function(lon, lat) {
			return function() {
				//console.log(lon, lat);
				app.map.setCursor(lon, lat);
			};
		})(mean[0], mean[1]), delay*l1);				*/				
	}
}
