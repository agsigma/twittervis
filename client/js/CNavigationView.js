CNavigationView = function(navElem, panelElem) {
	this.navElem = navElem;
	this.panelElem = panelElem;
}			

CNavigationView.prototype = _.extend({
	'tabs' : [],
	'addTab' : function(tab /*{'name' : string, 'view' : BackboneView} */) {
		var self = this;
		this.tabs.push({
			'name' : tab.name,
			'view' : tab.view,			
		});
		$(this.navElem)
			.find('[data-tabName="' + tab.name + '"]')
			.click(function() {							
				self.showPanel($(this).attr('data-tabName'));				
			});
		$(this.panelElem)
			.find('[data-tabName="' + tab.name + '"]')
			.empty();
		if (_.isArray(tab.view)) {
			_.each(tab.view, function(view) {
				$(self.panelElem)
					.find('[data-tabName="' + tab.name + '"]')
					.append(view.render().$el);
			});
		} else {
			$(this.panelElem)
				.find('[data-tabName="' + tab.name + '"]')
				.append(tab.view.render().$el);
		}
	},
	'init' : function() {
		var self = this;		
		app.ctrl.on('showPoint', function() {			
		});
		app.ctrl.on('updatePosition', function(options) {
			/*if (options.showMap) {
				self.showPanel('map');
			}*/
		});
		this.showPanel('home');
	},
	'showPoint' : function() {
	},
	'showPanel' : function(newTabName) {
		var self = this;		
		this.trigger('panelOpened', newTabName);
		if (newTabName == "home" || newTabName == "points") {
			app.router.navigate('home', {'trigger' : false});
		}		
		$(self.navElem)
			.find('[data-tabName]')
			.each(function() {
				var tabName = $(this).attr('data-tabName');
				if (tabName == newTabName) {
					$(this).addClass('active');
				} else {
					$(this).removeClass('active');
				}
			});			
		$(self.panelElem)
			.find('[data-tabName]')
			.each(function() {
				var tabName = $(this).attr('data-tabName');
				if (tabName == newTabName) {
					$(this).css('display', 'block');
				} else {
					$(this).css('display', 'none');
				}
			});			
	}
}, Backbone.Events);
