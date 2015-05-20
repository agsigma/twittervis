CMap = function(elem, app) {
	this.elem = elem;
	this.app = app;
	this.pointsSource = new ol.source.Vector({
		'features' : []
	});
	this.cursor = {
		'x' : 0,
		'y' : 40
	};
}

CMap.prototype = {
	'setCursor' : function(lon_x, lat_y) {
		this.cursor = {
			'x' : lon_x,
			'y' : lat_y
		};
		this.map.__cursorFeature.setGeometry((new ol.geom.Point([this.cursor.x, this.cursor.y])).transform('EPSG:4326', 'EPSG:3857'));
		app.ctrl.trigger('positionUpdated', this.cursor.x, this.cursor.y);			
	},
	'init' : function() {
		var pointsLayer, pointSource, cursorLayer;
		var iconStyle;
		var map;
		var app = this.app;
		var self = this;

		/*
		gmap = new google.maps.Map(document.getElementById('gmap'), {
			disableDefaultUI: true,
			keyboardShortcuts: false,
			draggable: false,
			disableDoubleClickZoom: true,
			scrollwheel: false,
			streetViewControl: false
		});	
		*/
		view = new ol.View({
			center: ol.proj.transform([21.0, 52.24], 'EPSG:4326', 'EPSG:3857'),
			zoom: 3,
			maxZoom: 21
		});
		/*
		view.on('change:center', function() {
			var center = ol.proj.transform(view.getCenter(), 'EPSG:3857', 'EPSG:4326');
			gmap.setCenter(new google.maps.LatLng(center[1], center[0]));
		});
		view.on('change:resolution', function() {
			gmap.setZoom(view.getZoom());
		});
		*/		
		/*
		iconStyle = new ol.style.Style({
			image: new ol.style.Icon({
				anchor: [0.5, 46],
				anchorXUnits: 'fraction',
				anchorYUnits: 'pixels',
				opacity: 0.75,
				src: 'data/icon.png'
			})
		});*/
		/*pointsSource = new ol.source.GeoJSON({
			'projection': 'EPSG:3857',
			url: 'http://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson'
		});*/		
		

		
		var featureStyle = new ol.style.Style({
		  image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
			anchor: [0.5, 1.0],
			anchorXUnits: 'fraction',
			anchorYUnits: 'fraction',
			opacity: 0.75,
			src: 'icons/osmimg/marker.png'
		  }))
		});
		pointsLayer = new ol.layer.Vector({
			title: 'Points',
			source: this.pointsSource,
			style: new ol.style.Style({
				/*image: new ol.style.Circle({
					radius: 6,
					//fill: new ol.style.Fill({color: 'red'}),
					stroke: new ol.style.Stroke({color: 'red', width: 2 })
				})*/
				/*
				image: new ol.style.RegularShape({
					points: 3,
					//opacity: 1.0,
					//scale: 1.0,
					radius: 12,
					radius2: 12,
					angle: 3.14159,
					fill: new ol.style.Fill({color: 'rgba(200,0,0,1.0)'}),
					stroke: new ol.style.Stroke({
						color: 'white',
						width: 2
					})
				})*/
				image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
					anchor: [0.5, 1.0],
					anchorXUnits: 'fraction',
					anchorYUnits: 'fraction',
					opacity: 0.75,
					src: 'icons/osmimg/marker.png'
				  }))				
			})
		});		
		pointsLayer = new ol.layer.Vector({
			title: 'Points',
			source: this.pointsSource,
			style: (function(featureStyle) {				
				var styles = [];
				styles = _.map(_.range(5), function(el) {					
					return new ol.style.Style({
						image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
							anchor: [0.5, 1.0],
							anchorXUnits: 'fraction',
							anchorYUnits: 'fraction',
							opacity: 0.8 + el*0.05,		
							scale: 1.0 + el*0.2,					
							src: 'icons/osmimg/marker.png'
						}))
					});
				});
				//styles=[featureStyle];
				return function(feature) {
					var styleNo = 0, dummyE;
					try {
						styleNo = Math.floor(Math.log2(feature.get('model').get('likesNo')+1));
						styleNo = Math.min(4, styleNo);
					} catch(dummyE) {}
					console.log(styleNo, styles);
					return [styles[styleNo]];
				}				
			})(featureStyle)
		});	

		map = new ol.Map({
			target: $(this.elem)[0],
			layers: [
				new ol.layer.Tile({
					source: new ol.source.MapQuest({layer: 'osm'})
				}),
				pointsLayer
			],
			view: view /*new ol.View({
				center: ol.proj.transform([21.0, 52.24], 'EPSG:4326', 'EPSG:3857'),
				zoom: 12
			})*/,
			'keyboardEventTarget' : document
		});		
		
		map.on('click', function(evt) {
			var coords = ol.proj.transform(evt.coordinate, 'EPSG:3857', 'EPSG:4326'), x, y;
			x = coords[0];
			y = coords[1];		
			var feature = map.forEachFeatureAtPixel(evt.pixel, function(feature, layer) {
				var model = feature.get('model');							
				app.ctrl.trigger('showPoint', model.get('id'));
				return feature;
			}, null, /*filter*/ function(layer) {
				return layer == pointsLayer;
			});				
			// przenosimy marker polozenia
			if (!feature) {						
				self.setCursor(x, y);				
			}		
		});
		
		//cursor layer 
		iconFeature = new ol.Feature({
		  geometry: new ol.geom.Point([this.x, this.y]),
		  name: 'Null Island',
		  population: 4000,
		  rainfall: 500
		});		
		map.__cursorFeature = iconFeature;
		
		cursorLayer = new ol.layer.Vector({		
			source: new ol.source.Vector({
				'features' : [iconFeature]
			}),
			style: [
				/*new ol.style.Style({
					image: new ol.style.Icon({
						anchor: [0.5, 0.85],
						anchorXUnits: 'fraction',
						anchorYUnits: 'fraction',
						opacity: 1.0,
						scale: 0.5,
						src: 'icons/ee1100-street-view-64.png'
					})
				}),*/
				new ol.style.Style({
					image: new ol.style.Circle({
						radius: 15,
						//fill: new ol.style.Fill({color: 'black'}),
						stroke: new ol.style.Stroke({color: '#000', width: 7 })
					})
				}),
				new ol.style.Style({
					image: new ol.style.Circle({
						radius: 15,
						//fill: new ol.style.Fill({color: 'black'}),
						stroke: new ol.style.Stroke({color: '#E10', width: 3 })
					})
				}),
				new ol.style.Style({
					image: new ol.style.Circle({
						radius: 3,
						fill: new ol.style.Fill({color: '#E10'}),
						stroke: new ol.style.Stroke({color: '#000', width: 2 })
					})
				})
				]
				/*image: new ol.style.Circle({
					radius: 10,
					//fill: new ol.style.Fill({color: 'black'}),
					stroke: new ol.style.Stroke({color: 'red', width: 3 })
				})*/
				/*image: new ol.style.RegularShape({
					points: 4,
					//opacity: 1.0,
					//scale: 1.0,										
					radius: 20,
					radius2: 5,
					angle: 3.14159,
					fill: new ol.style.Fill({color: 'rgba(0,0,0,0.5)'}),
					stroke: new ol.style.Stroke({
						color: '#FFF',
						width: 2
					})
				})*/			
		});		
		map.addLayer(cursorLayer);
		
		this.map = map;
		//olMapDiv.parentNode.removeChild(olMapDiv);
		//gmap.controls[google.maps.ControlPosition.TOP_LEFT].push(olMapDiv);
	}
};
/*	

var geolocation = new ol.Geolocation({
  tracking: false
});

geolocation.on('change', function(evt) {
  //save position and set map center
  alert(JSON.stringify(geolocation.getPosition()));  
});

*/
