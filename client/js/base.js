//console = false;
console = console || {log:function () {}};
_.templateSettings.variable = "data";
// przepisac na wlasne
_.geoDist = function(lon1, lat1, lon2, lat2) {
	var dLon, dLat;
	var toRad = function(Value) {
		return Value * Math.PI / 180;
	}
	var R = 6371; // km
	lat1 = (lat1 < 90 ? lat1 : 89.9);
	lat1 = (lat1 > -90 ? lat1 : -89.9);
	lat2 = (lat2 < 90 ? lat2 : 89.9);
	lat2 = (lat2 > -90 ? lat2 : -89.9);
	lon1 = (lon1 < 180 ? lon1 : 179.9);
	lon1 = (lon1 > -180 ? lon1 : -179.9);
	lon2 = (lon2 < 180 ? lon2 : 179.9);
	lon2 = (lon2 > -180 ? lon2 : -179.9);
	dLat = toRad(lat2-lat1);
	dLon = toRad(lon2-lon1);
	lat1 = toRad(lat1);
	lat2 = toRad(lat2);

	var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
	Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
	var d = R * c;
	return d;
}

app = {};

var CPoint = Backbone.Model.extend({
	'initialize' : function() {
		this.set('id', _.uniqueId())
	},
	'addLike' : function() {
		var likesNo = this.get('likesNo') || 0;	
		if (!this.__likeAdded) {
			this.set('likesNo', likesNo+1);			
		} else {			
		}
		this.__likeAdded = true;		
	}
});
var CPointComment = Backbone.Model.extend();
var CPointCollection = Backbone.Collection.extend({
	'model' : CPoint,
	'comparator' : function(model) {return -model.get('likesNo')*10 || 1;}
});




app.map = new CMap('#olmap', app);
app.router = new (Backbone.Router.extend({
	"routes" : {
		"show/:id" : "show",
		"3words/:words"	: "words"
	},
	'show' : function(id) {
		app.ctrl.trigger("showPoint", id);
	},
	'words' : function(words) {
		console.log(words);
		app.ctrl.trigger("updatePosition", {'words' : words, 'showMap' : true});
	}
}))();



app.ctrl = _.extend({}, Backbone.Events);
app.ctrl.on('showPoint', function(id, options) {
	var x, y, model;
	console.log('newView', id);
	options = _.extend({
		'centerMap' : true,
		'animate' : true
	}, options || {});	
	model = app.points.get(id);
	if (!!model && _.intersection(model.keys(), ['lon', 'lat', 'text']).length == 3) {
		// dodaje +1 do licznika wyswietlen
		app.points.trigger('newView', model.get('id'));					
		alert(model.get('text'));
		if (options.centerMap) {
			app.ctrl.zoomToPoint(model.get('lon'), model.get('lat'), false, options.animate);		
		}
	}		
	app.router.navigate('show/' + id, {'trigger' : false});
});
app.ctrl.on('positionUpdated', function(x, y) {
	console.log('positionUpdated');
});
app.ctrl.on('updatePosition',  function(options) {
	options = options || {};
	if (options.words) {
		console.log(options.words);
		console.log('updatePosition');
		$.getJSON('https://api.what3words.com/w3w?key=5Z2J6DKA&string=' + options.words)
			.done(function(res) {			
				var pan;
				console.log(res);	
				app.router.navigate('3words/' + options.words, {'trigger' : false});
				if (!!res && !!res.position) {				
					app.ctrl.zoomToPoint(res.position[1], res.position[0], true);					
				}
			});
	}	
});
app.ctrl.zoomToPoint = function(lon_x, lat_y, moveCursor, animate) {
	app.map.zoomToPoint(lon_x, lat_y, moveCursor, animate);
}


//points.add({'lat' : 0.0, 'lon' : 20.0, 'name' : 'AAA', 'data' : null});
app.points = new CPointCollection();

// wyswietlenie POI
app.points.on('newView', function(modelID) {
	var model = app.points.get(modelID);
	var viewsNo;
	if (!!model) {
		viewsNo = model.get('viewsNo') || 0;			
		model.set('viewsNo', viewsNo+1);
	}
}, app.points);

app.points.on('add', function(model, collection, options) {
	var x, y;				
	x = model.get('lon');
	y = model.get('lat');				
	if ((!!x || x === 0) && (!!y || y === 0)) {					
		app.map.pointsSource.addFeature(new ol.Feature({
			'geometry' : new ol.geom.Point([x, y]).transform('EPSG:4326', 'EPSG:3857'),
			'name' : name,
			'model' : model
		}));
	}
});



