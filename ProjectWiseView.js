Ext.define('ProjectWiseView', {
	projWiseStatusDiag : null,
	selectedMilestone : null,
	selectedMilestoneObj : null,
	artifactsData : null,

	_prepareMilestoneProjectWiseViewPopup : function(record) {
		this.projWiseStatusDiag = Ext.create('Rally.ui.dialog.Dialog', {
			autoShow : false,
			draggable : false,
			closable : true,
			closeAction : 'destroy',
			padding : 10,
			width : 800,
			height : 500,
			autoScroll : true,
			id : 'Project_Wise_Status_Diag'
		});

		var dialogTitle = record.get('FormattedID') + ': Milestone Project Wise User Story View';
		this.projWiseStatusDiag.setTitle(dialogTitle);
		this.projWiseStatusDiag.removeAll(true);
		this.projWiseStatusDiag.show();
	},

	_getMilestoneProjectWiseView : function(milestoneRec) {
		var projWiseStatusDiagId = this.projWiseStatusDiag.getId();

		if (milestoneRec !== null) {
			this.selectedMilestone = milestoneRec.get('ObjectID');
			this.selectedMilestoneObj = milestoneRec;

			Ext.getCmp(projWiseStatusDiagId).mask('Creating Milestone Project Wise User Story View for ' + this.selectedMilestoneObj.get('FormattedID') + '...');

			this._loadProjectWiseViewArtifacts(this.projWiseStatusDiag);
		}
	},

	/**
	 * Get the milestone data to create the doc
	 */
	_loadProjectWiseViewArtifacts : function(projWiseStatusDiag) {

		var selectedMilestone = this.selectedMilestone;

		return Ext.create('Rally.data.wsapi.artifact.Store', {
			models : [ 'portfolioitem/feature', 'userstory', 'defect' ],
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
				value : selectedMilestone
			} ]
		}).load().then({
			success : function(artifacts) {
				this.artifactsData = artifacts;
				this._getProjectWiseViewGridData(projWiseStatusDiag);
			},
			scope : this
		});
	},

	/**
	 * Get grid data
	 */
	_getProjectWiseViewGridData : function(projWiseStatusDiag) {

		var that = this;

		Ext.create('Rally.data.wsapi.TreeStoreBuilder').build({
			model : [ 'userstory', 'defect' ],
			autoLoad : true,
			compact : false,
			enableHierarchy : true,
			context : {
				workspace : Rally.environment.getContext().getWorkspace()._ref,
				project : null,
				projectScopeUp : false,
				projectScopeDown : true
			},
			filters : that._getProjectWiseViewGridFilter(),
			fetch : [ 'FormattedID', 'Name', 'Feature', 'Project', 'ScheduleState' ],
			limit : Infinity,
			sorters : [ {
				property : 'Feature',
				direction : 'ASC'
			} ]
		}).then({
			success : function(store) {
				that._drawProjectWiseViewGrid(store, projWiseStatusDiag);
			}
		});

	},

	/**
	 * Filter for Grid
	 */
	_getProjectWiseViewGridFilter : function() {

		var filter = null;

		Ext.Array.each(this.artifactsData, function(artifactData) {
			if (artifactData.get("PortfolioItemTypeName") === "Feature") {
				if (filter === null) {
					filter = Ext.create('Rally.data.wsapi.Filter', {
						property : 'Feature.ObjectID',
						operator : '=',
						value : artifactData.getId()
					});
				} else {
					filter = filter.or(Ext.create('Rally.data.wsapi.Filter', {
						property : 'Feature.ObjectID',
						operator : '=',
						value : artifactData.getId()
					}));
				}
			} else {
				if (filter === null) {
					filter = Ext.create('Rally.data.wsapi.Filter', {
						property : 'ObjectID',
						operator : '=',
						value : artifactData.getId()
					});
				} else {
					filter = filter.or(Ext.create('Rally.data.wsapi.Filter', {
						property : 'ObjectID',
						operator : '=',
						value : artifactData.getId()
					}));
				}
			}

		});

		return filter;
	},

	/**
	 * Draw grid
	 */
	_drawProjectWiseViewGrid : function(gridStore, projWiseStatusDiag) {
		var that = this;

		if (projWiseStatusDiag.down('rallygridboard')) {
			projWiseStatusDiag.down('rallygridboard').destroy();
		}

		projWiseStatusDiag.add({
			xtype : 'rallygridboard',
			id : 'gridData',
			modelNames : [ 'userstory' ],
			toggleState : 'grid',
			stateful : false,
			plugins : [ {
				ptype : 'rallygridboardactionsmenu',
				menuItems : [ {
					text : 'Export to csv',
					handler : function() {
						window.location = Rally.ui.grid.GridCsvExport.buildCsvExportUrl(projWiseStatusDiag.down('rallygridboard').getGridOrBoard());
					},
					scope : this
				}, {
					text : 'Print',
					handler : function() {
						Ext.create('Rally.ui.grid.TreeGridPrintDialog', {
							grid : projWiseStatusDiag.down('rallygridboard').getGridOrBoard(),
							treeGridPrinterConfig : {
								largeHeaderText : 'Milestone Project Wise User Story View'
							}
						});
					},
					scope : this
				} ],
				buttonConfig : {
					iconCls : 'icon-export'
				}
			} ],
			gridConfig : {
				columnCfgs : [ 'FormattedID', 'Name', 'ScheduleState', 'Project', 'Feature' ],
				store : gridStore,
				enableEditing : false,
				enableRanking : false,
				enableInlineAdd : false,
				enableBulkEdit : false,
				enableScheduleStateClickable : false,
				showRowActionsColumn : false
			},
			height : 425
		});

		Ext.getCmp(projWiseStatusDiag.getId()).unmask();
	}

});
