CMap = function(elem, app) {
	this.elem = elem;
	this.app = app;
	this.pointsSource = new ol.source.Vector({
		'features' : []
	});
	this.gridSource = new ol.source.Vector({
		'features' : []
	});	
	this.cursor = {
		'x' : 0,
		'y' : 40
	};
}

CMap.prototype = {
	'render' : function() {console.log('dummy CMap.render()');},
	'zoomToPoint' : function(lon_x, lat_y, moveCursor, animate) {		
		var pan, zoom;
		animate = animate || false;
		moveCursor = moveCursor || false;
		if (animate) {
			pan = ol.animation.pan({
				duration: 1000,
				source: this.map.getView().getCenter(),
				start: _.now()
			});	

			zoom = ol.animation.zoom({
				duration: 1000,
				resolution: this.map.getView().getResolution(),
				start: _.now()
			});
			this.map.beforeRender(pan, zoom);
		}
		this.map.getView().setCenter(ol.proj.transform([lon_x, lat_y], 'EPSG:4326', 'EPSG:3857'));
		this.map.getView().setZoom(15);
		if (!!moveCursor) {
			this.setCursor(lon_x, lat_y);
		}
	},
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
		var layerSwitcher;
		var iconStyle;
		var map;
		var app = this.app;
		var self = this;
		
		
		view = new ol.View({
			center: ol.proj.transform([21.0, 52.24], 'EPSG:4326', 'EPSG:3857'),
			zoom: 3,
			maxZoom: 21
		});		
		
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
			style: function(feature, resolution) {
				var instagram = null, dummyE;
				try {
					instagram = feature.get('model').get('instagram');
					// console.log(feature.get('model'), instagram,' map');
				} catch(dummyE) {
				}
				if (!!instagram) {
					return [new ol.style.Style({
						image: new ol.style.Circle({
							radius: 3,
							fill: new ol.style.Fill({color: '#E10'}),
							stroke: new ol.style.Stroke({color: '#000', width: 1 })
						})
					})];
				} else {
					return [new ol.style.Style({
						image: new ol.style.Circle({
							radius: 3,
							fill: new ol.style.Fill({color: '#999'}),
							stroke: new ol.style.Stroke({color: '#000', width: 1 })
						})
					})];
				}
			  }
		});	
		
		var heatmap = new ol.layer.Heatmap({
			title: 'Heatmap',
			source: this.pointsSource,
			radius: 5,
			blur: 10
		});

		heatmap.getSource().on('addfeature', function(event) {
		  // 2012_Earthquakes_Mag5.kml stores the magnitude of each earthquake in a
		  // standards-violating <magnitude> tag in each Placemark.  We extract it from
		  // the Placemark's name instead.
		  //var name = event.feature.get('name');
		  //var magnitude = parseFloat(name.substr(2));
			if (!event.feature.get('model').get('text').match(/humidity|pressure|barometer/i)) {
				console.log('weight: 2');
				event.feature.set('weight', 2);
			} else {
				event.feature.set('weight', 0);
			}
		});


		
		styleCache = {};
		clusters = new ol.layer.Vector({
			title : 'Clusters',
		  source: new ol.source.Cluster({
			  distance: 50,
			  source: self.gridSource			
		}),
		  style: function(feature, resolution) {
			var size = 0;
			var style = styleCache[size], fts = feature.get('features');
			for (l1 =0; l1 < fts.length; l1++) {
				size += pointsGrid.get(fts[l1].lon, fts[l1].lat).no;
			}
			if (!style) {
			  style = [new ol.style.Style({
				image: new ol.style.Circle({
				  radius: Math.floor(Math.log2(size))*1.5+3,				  
				  fill: new ol.style.Fill({
					color: '#C20'
				  })
				}),
				text: new ol.style.Text({
				  text: size.toString(),
				  fill: new ol.style.Fill({
					color: '#FFF'
				  }),
				  font: 'Normal 10px Arial'				  
				})
			  })];			  
			  styleCache[size] = style;
			}
			return style;
		  }
		});


		map = new ol.Map({
			target: $(this.elem)[0],
			layers: [
				new ol.layer.Tile({
					title: 'Mapa',
					type: 'base',
					source: new ol.source.MapQuest({layer: 'osm'})
				}),				
				heatmap,
				pointsLayer,
				clusters
			],
			view: view,
			'keyboardEventTarget' : document
		});		
		
		map.on('click', function(evt) {
			var coords = ol.proj.transform(evt.coordinate, 'EPSG:3857', 'EPSG:4326'), x, y;
			x = coords[0];
			y = coords[1];		
			var feature = map.forEachFeatureAtPixel(evt.pixel, function(feature, layer) {
				var model = feature.get('model');											
				app.ctrl.trigger('showPoint', model.get('id'), {'centerMap' : false && app.map.map.getView().getZoom() < 11});				
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
		});		
		map.addLayer(cursorLayer);
		
		layerSwitcher = new ol.control.LayerSwitcher({
			tipLabel: 'Légende' // Optional label for button
		});
		map.addControl(layerSwitcher);

		
		this.map = map;
		
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
