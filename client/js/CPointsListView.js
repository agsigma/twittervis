APointView = {
	'tagName' : 'div',
	'className' : '',
	'templateElem' : '#pointViewTemplete',
	'initialize' : function() {		
		this.template = _.template($(this.templateElem).html());
		this.listenTo(this.model, "change", this.render);					
		this.render();
	},
	'render' : function() {
		var self = this;
		$(this.$el).html(this.template({'model' : this.model, 'data' : this.data}));					
		// console.log(this.data);
		// console.log('html:', this.template({'model' : this.model}));		
		return this;
	}
}			

CPointListElemView = Backbone.View.extend(_.extend(APointView, {
	'tagName' : 'li',
	'className' : 'list-group-item',
	'templateElem' : '#pointListItemTemplate'
}));

CPointsListView = Backbone.View.extend({
	'tagName' : 'ul',
	'className' : 'list-group',				
	'initialize' : function() {
		var self = this;					
		var coords = [0,0], dummyE;
		try {
			coords = ol.proj.transform(app.map.map.getView().getCenter(), 'EPSG:3857', 'EPSG:4326');
		} catch(dummyE) {
		}					
		app.points.on('add', _.throttle(function() {
			var coords = [0,0];
			try {
				coords = [app.map.cursor.x, app.map.cursor.y];
			} catch(dummyE) {
			}			
			self.createModelsList(coords[0], coords[1]);
			self.render();
		}, 1000, false));
		
		app.ctrl.on('positionUpdated', _.throttle(function(){
			var coords = [0,0];
			try {
				coords = [app.map.cursor.x, app.map.cursor.y];
			} catch(dummyE) {
			}			
			self.createModelsList(coords[0], coords[1]);
			self.render();
		}, 1000, false));
				
		this.render();
		return false;
	},
	'createModelsList' : function(lon_x, lat_y) {
		var self = this;
		self.lon_x = lon_x;
		self.lat_y = lat_y;
		lat_y = (lat_y < 90 ? lat_y : 89.9);
		lat_y = (lat_y > -90 ? lat_y : -89.9);
		lon_x = (lon_x < 180 ? lon_x : 179.9);
		lon_x = (lon_x > -180 ? lon_x : -179.9);
		this.modelsList = [];										
		this.collection.forEach(function(model) {
			self.modelsList.push(model);						
		});
		this.modelsList = _.chain(this.modelsList)
			.sortBy(function(poi) {
				return _.geoDist(poi.get('lon'), poi.get('lat'), lon_x, lat_y);
			})
			.first(10)
			.value();
	},
	'render' : function() {
		var self = this;
		var modelsList;					
		modelsList = this.modelsList || [];
		//console.log(this.collection);
		this.$el.empty();
		_.each(modelsList, function(poi) {
			var poiView = new CPointListElemView({
				'model' : poi
			});			
			poiView.data = {
				'dist' : _.geoDist(poi.get('lon'), poi.get('lat'), self.lon_x, self.lat_y)
			}
			poiView.render();
			//console.log(poiView);									
			poiView.$el.appendTo(self.$el);						
		});
		return this;
	}
});
