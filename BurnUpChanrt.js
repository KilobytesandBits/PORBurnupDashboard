Ext.define('BurnUpChart', {
	selectedMilestone : null,
	selectedMilestoneObj : null,
	piRecords : null,

	_getMilestoneBurnupChart : function(milestoneRec, chartDiag) {
		var chartDiagId = chartDiag.getId();

		if (milestoneRec !== null) {
			console.log('milestoneData: ', milestoneRec);

			this.selectedMilestone = milestoneRec.get('ObjectID');
			this.selectedMilestoneObj = milestoneRec;

			Ext.getCmp(chartDiagId).mask('Creating Burnup Chart for ' + this.selectedMilestoneObj.get('FormattedID') + '...');

			this._getBurnupChart(chartDiag);
		}
	},

	/**
	 * Create the burnup chart and draw it
	 */
	_getBurnupChart : function(chartDiag) {

		Deft.Promise.all([ this._loadPIsInMilestone(), this._loadScheduleStateValues() ]).then({
			success : function() {
				var burnupChart = this._getChart(true, null, chartDiag);

				if (burnupChart !== null) {

					chartDiag.removeAll(true);

					if (chartDiag.down('rallychart')) {
						chartDiag.down('rallychart').destroy();
					}

					chartDiag.add(burnupChart);

					var that = this;

					Ext.Array.each(this.piRecords, function(piRecord, index) {
						var piBurnupChart = that._getChart(false, piRecord, chartDiag);

						if (piBurnupChart !== null) {
							chartDiag.add(piBurnupChart);
						}
					});

				}

			},
			scope : this
		});
	},

	_loadScheduleStateValues : function() {
		return Rally.data.ModelFactory.getModel({
			type : 'UserStory',
			success : function(model) {
				model.getField('ScheduleState').getAllowedValueStore().load({
					callback : function(records) {
						this.scheduleStateValues = _.invoke(records, 'get', 'StringValue');
					},
					scope : this
				});
			},
			scope : this
		});
	},

	_loadPIsInMilestone : function() {
		var that = this;
		return Ext.create('Rally.data.wsapi.artifact.Store', {
			models : [ 'portfolioitem/feature', 'defect', 'userstory' ],
			context : {
				workspace : Rally.environment.getContext().getWorkspace()._ref,
				project : null,
				limit : Infinity,
				projectScopeUp : false,
				projectScopeDown : true
			},
			filters : [ {
				property : 'Milestones.ObjectID',
				operator : '=',
				value : that.selectedMilestone
			} ]
		}).load().then({
			success : function(artifacts) {
				this.piRecords = artifacts;
			},
			scope : this
		});
	},

	_getChart : function(isMileStone, piRecord, chartDiag) {
		var that = this;

		var chartStartDate = that.selectedMilestoneObj.get('ActiveStartDate') !== '' ? that.selectedMilestoneObj.get('ActiveStartDate') : _.min(_.compact(_.invoke(that.piRecords, 'get',
				'ActualStartDate')));
		var chartEndDate = that.selectedMilestoneObj.get('TargetDate');

		var chart = {
			xtype : 'rallychart',
			flex : 1,
			storeType : 'Rally.data.lookback.SnapshotStore',
			storeConfig : isMileStone ? that._getStoreConfig() : that._getStoreConfigForPI(piRecord.data.ObjectID),
			calculatorType : 'Rally.example.BurnCalculator',
			calculatorConfig : {
				completedScheduleStateNames : [ 'Accepted', 'Released' ],
				stateFieldValues : that.scheduleStateValues,
				startDate : chartStartDate,
				endDate : chartEndDate,
				enableProjects : true
			},
			chartColors : [ "#A16E3A", "#1B7F25", "#B1B1B7", "#2E2EAC" ],
			chartConfig : that._getChartConfig(isMileStone, piRecord),
			listeners : {
				afterrender : function(obj, eOpts) {
					Ext.getCmp(chartDiag.getId()).unmask();
				},
				scope : this
			}
		};

		return chart;
	},

	/**
	 * Generate the store config to retrieve all snapshots for all leaf
	 * child stories of the specified PI
	 */
	_getStoreConfig : function() {
		return {
			find : {
				_TypeHierarchy : {
					'$in' : [ 'HierarchicalRequirement' ]
				},
				_ItemHierarchy : {
					'$in' : _.invoke(this.piRecords, 'getId')
				}
			},
			fetch : [ 'ScheduleState', 'PlanEstimate' ],
			hydrate : [ 'ScheduleState' ],
			sort : {
				_ValidFrom : 1
			},
			context : Rally.environment.getContext().getDataContext(),
			limit : Infinity
		};
	},

	/**
	 * Generate the store config to retrieve all snapshots for all leaf
	 * child stories of a specified PI
	 */
	_getStoreConfigForPI : function(piId) {
		return {
			find : {
				_TypeHierarchy : {
					'$in' : [ 'HierarchicalRequirement' ]
				},
				_ItemHierarchy : piId
			},
			fetch : [ 'ScheduleState', 'PlanEstimate' ],
			hydrate : [ 'ScheduleState' ],
			sort : {
				_ValidFrom : 1
			},
			context : Rally.environment.getContext().getDataContext(),
			limit : Infinity
		};
	},

	/**
	 * Generate a valid Highcharts configuration object to specify the
	 * chart
	 */

	_getChartConfig : function(isMileStone, piRecord) {
		var chartTitle = ' ';

		if (isMileStone) {
			chartTitle = 'Milestone Burnup';
		} else {
			if (piRecord.data.c_ClassofService !== null && piRecord.data.c_ClassofService !== '' && piRecord.data.c_ClassofService !== undefined) {
				chartTitle = piRecord.data.c_ClassofService + ' - ';
			}

			chartTitle += piRecord.data.FormattedID + ' - ' + piRecord.data.Name;
		}

		return {
			chart : {
				defaultSeriesType : 'area',
				zoomType : 'xy'
			},
			title : {
				text : chartTitle
			},
			xAxis : {
				categories : [],
				tickmarkPlacement : 'on',
				tickInterval : 5,
				title : {
					text : 'Date',
					margin : 10
				}
			},
			yAxis : [ {
				title : {
					text : 'Counts'
				}
			} ],
			tooltip : {
				formatter : function() {
					return '' + this.x + '<br />' + this.series.name + ': ' + Math.ceil(this.y);
				}
			},
			plotOptions : {
				series : {
					marker : {
						enabled : false,
						states : {
							hover : {
								enabled : true
							}
						}
					},
					groupPadding : 0.01
				},
				column : {
					stacking : null,
					shadow : false
				}
			}
		};
	}
});