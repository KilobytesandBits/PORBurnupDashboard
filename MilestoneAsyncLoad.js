var types = Ext.data.Types;
Ext.define('MilestoneTreeModel', {
	extend : 'Ext.data.TreeModel',
	fields : [ {
		name : 'ObjectID',
		mapping : 'ObjectID',
		type : types.STRING
	}, {
		name : 'FormattedID',
		mapping : 'FormattedID',
		type : types.STRING
	}, {
		name : 'Name',
		mapping : 'Name',
		type : types.STRING
	}, {
		name : 'StartDate',
		mapping : 'ActualStartDate',
		type : types.DATE
	}, {
		name : 'ActiveStartDate',
		mapping : 'ActiveStartDate',
		type : types.DATE
	}, {
		name : 'TargetDate',
		mapping : 'AcceptedDate',
		type : types.DATE
	}, {
		name : 'TargetProject',
		mapping : 'TargetProject',
		type : types.OBJECT
	}, {
		name : 'ValueStream',
		mapping : 'ValueStream',
		type : types.STRING
	}, {
		name : 'Visibility',
		mapping : 'Visibility',
		type : types.STRING
	}, {
		name : 'AdditionalReferences',
		mapping : 'AdditionalReferences',
		type : types.STRING
	}, {
		name : 'Status',
		mapping : 'Status',
		type : types.STRING
	}, {
		name : 'DisplayColor',
		mapping : 'DisplayColor',
		type : types.STRING
	}, {
		name : 'Notes',
		mapping : 'Notes',
		type : types.STRING
	}, {
		name : '_ref',
		mapping : '_ref',
		type : types.STRING
	}, {
		name : 'AcceptedLeafStoryCount',
		mapping : 'AcceptedLeafStoryCount',
		type : types.STRING
	}, {
		name : 'LeafStoryCount',
		mapping : 'LeafStoryCount',
		type : types.STRING
	}, {
		name : 'FeaturesWithoutChildrenCount',
		mapping : 'FeaturesWithoutChildrenCount',
		type : types.INT
	}, {
		name : 'StoryProgressPercent',
		mapping : 'StoryProgressPercent',
		type : types.FLOAT
	},{
		name : 'AssociatedTeams',
		mapping : 'AssociatedTeams',
		type : types.STRING
	}],
	hasMany : {
		model : 'FeatureTreeModel',
		name : 'features',
		associationKey : 'features'
	}
});

Ext.define('MilestoneDataModel', {
	extend : 'Ext.data.Model',
	fields : [ {
		name : 'ObjectID',
		mapping : 'ObjectID',
		type : types.STRING
	}, {
		name : 'FormattedID',
		mapping : 'FormattedID',
		type : types.STRING
	}, {
		name : 'Name',
		mapping : 'Name',
		type : types.STRING
	}, {
		name : 'ActiveStartDate',
		mapping : 'ActiveStartDate',
		type : types.DATE
	}, {
		name : 'StartDate',
		mapping : 'ActualStartDate',
		type : types.DATE
	}, {
		name : 'TargetDate',
		mapping : 'AcceptedDate',
		type : types.DATE
	}, {
		name : 'TargetProject',
		mapping : 'TargetProject',
		type : types.OBJECT
	}, {
		name : 'ValueStream',
		mapping : 'ValueStream',
		type : types.STRING
	}, {
		name : 'Visibility',
		mapping : 'Visibility',
		type : types.STRING
	}, {
		name : 'AdditionalReferences',
		mapping : 'AdditionalReferences',
		type : types.STRING
	}, {
		name : 'Status',
		mapping : 'Status',
		type : types.STRING
	}, {
		name : 'DisplayColor',
		mapping : 'DisplayColor',
		type : types.STRING
	}, {
		name : 'Notes',
		mapping : 'Notes',
		type : types.STRING
	}, {
		name : '_ref',
		mapping : '_ref',
		type : types.STRING
	}, {
		name : 'AcceptedLeafStoryCount',
		mapping : 'AcceptedLeafStoryCount',
		type : types.INT
	}, {
		name : 'LeafStoryCount',
		mapping : 'LeafStoryCount',
		type : types.INT
	}, {
		name : 'FeaturesWithoutChildrenCount',
		mapping : 'FeaturesWithoutChildrenCount',
		type : types.INT
	}, {
		name : 'StoryProgressPercent',
		mapping : 'StoryProgressPercent',
		type : types.FLOAT
	},{
		name : 'AssociatedTeams',
		mapping : 'AssociatedTeams',
		type : types.STRING
	}]
});

Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    config : {
		defaultSettings : {
			valueStreamPicker : 'FPA, Integration'
		}
	},
	
	getSettingsFields : function() {
		return [ {
			name : 'includeGlobalMilestones',
			xtype : 'rallycheckboxfield',
			fieldLabel : '',
			boxLabel : 'Include global milestones'
		}, {
			name : 'showNumberOfMonths',
			xtype : 'rallynumberfield',
			fieldLabel : 'Date Range (months)'
		}, {
			name : 'valueStreamPicker',
			xtype : 'rallyfieldvaluecombobox',
			model : 'Milestone',
			field : 'c_ValueStream',
			fieldLabel : 'Value Stream',
			allowNoEntry : true,
			multiSelect : true
		}, {
			name : 'teamPicker',
			xtype : 'rallymultiobjectpicker',
			overflowY: 'auto',
			modelType: 'Project',
			fieldLabel : 'Associated Teams',
			filterFieldName: 'Name',
			storeConfig : {
				autoLoad: false,
				fetch: ['Name', 'State'],
				pageSize: 200,
                context : {
					project: '/project/1694641494',
					projectScopeUp : false,
					projectScopeDown : true
				},
				filters:[{
                    Property:'State',
                    operator : '=',
                    Value: 'Open'
                }],
                sorters : [{
					property : 'Name',
					direction : 'ASC'
				}],
				remoteGroup: false,
				remoteSort: false,
				remoteFilter: false,
				limit : Infinity
            },
            listCfg: {
            	displayField: 'Name'
            },
            stateful: false
		} ];
	},

	items : [ {
		xtype : "container",
		itemId : "filterContainer",
		id : "filterContainer",
		layout : {
			type : 'hbox',
			align : 'left'
		}
	}, {
		xtype : "container",
		itemId : "gridContainer",
		id : "gridContainer"
	} ],
    
    
    launch: function() {
    	var teamSelected = this.getSetting('teamPicker');
		console.log('Get team selected Values: ', teamSelected);
		var selectedProjStoreConfig = this._getAllExecutiveProjStoreConfig(teamSelected);

		this.down('#filterContainer').add({
			xtype : 'rallycheckboxfield',
			id : 'executiveVisibilityCheckbox',
			boxLabel : 'Show Executive Visibility Only',
			labelWidth : 200,
			padding : '10, 5, 10, 5',
			checked : false,
			listeners : {
				change : this._onReady,
				//render : this._onReady,
				scope : this
			}
		}, {
			xtype : 'rallymultiobjectpicker',
			id : 'teamFilterMultiPicker',
			padding : '10, 5, 10, 5',
			modelType : 'Project',
			fieldLabel : 'Teams',
			labelAlign : 'right',
			width : 400,
			filterFieldName: 'Name',
			storeConfig : selectedProjStoreConfig,
            listCfg: {
            	displayField: 'Name'
            },
            stateful: false,
            listeners : {
				selectionchange : function(picker, values, eOpts){
					if(values !== null){
						this.selectedMultiTeamFilter = this._getProjectRefString(values);
					}
				},
				collapse: function(field, eOpts){
					this._onReady();
				},
				//render : this._onReady,
				scope : this
			}
		});
		
		this._loadAllMilestones();
    },
    
    _getProjectRefString: function(values){
		var teamList = '';
		Ext.Array.each(values, function(thisProject){
			if(thisProject.get('_ref') !== null)
				teamList = teamList + thisProject.get('_ref') + ',';
		});
		
		return (teamList !== '' && teamList.length > 1) ? teamList.substring(0, teamList.length-1) : teamList;
	},
	
	_getAllExecutiveProjStoreConfig: function(teamSelected){
		
		var teamMilestoneFilter = Ext.create('Rally.data.wsapi.Filter', {
				property : 'State',
				operator : '=',
				value : 'Open'
			});
			
		if(teamSelected !== null && teamSelected !== undefined && teamSelected !== ''){
			var teamFilters = teamSelected.split(',');
	
			teamMilestoneFilter = teamMilestoneFilter.and(Ext.create('Rally.data.wsapi.Filter', {
				property : '_ref',
				operator : 'contains',
				value : teamFilters[0]
			}));
			
			if (teamFilters.length > 1) {
				for (var i = 1; i < teamFilters.length; i++) {
					teamMilestoneFilter = teamMilestoneFilter.or(Ext.create('Rally.data.wsapi.Filter', {
						property : '_ref',
						operator : 'contains',
						value : teamFilters[i]
					}));
				}
			}
		}
		
		var storeConfig = {
				autoLoad: false,
				fetch: ['Name', 'State'],
				pageSize: 200,
                context : {
					project: '/project/1694641494',
					projectScopeUp : false,
					projectScopeDown : true
				},
				filters: teamMilestoneFilter,
                sorters : [{
					property : 'Name',
					direction : 'ASC'
				}],
				remoteGroup: false,
				remoteSort: false,
				remoteFilter: false,
				limit : Infinity
            };
        
        return storeConfig;
	},
	
	_onReady : function() {

		this._loadAllMilestones();
	},
    
    _loadAllMilestones: function(){
    	Ext.getBody().mask('Loading...');
    	
        this._createMilestoneStoreFilter();
        
        var milsetoneStore = 	Ext.create("Rally.data.wsapi.Store", 
        {
			model : 'milestone',
			autoLoad : true,
			compact : false,
			filters : this.projectMilestoneFilter,
			sorters : [{
				property : 'c_ValueStream',
				direction : 'ASC'
			}, {
				property : 'TargetDate',
				direction : 'ASC'
			}]
		});
		
		this.milestoneArtifactMappingColl = [];
		this.featureUserStoriesMappingColl = [];
		this.milestoneUserStoriesMappingColl = [];
		this.milestoneFeatureWithoutChildrenCountMappingColl = [];
		this.filteredMilestoneDataCollection = [];
		
		milsetoneStore.load().then({
		    success: this._loadArtifacts,
		    scope: this
		}).then({
		    success: this._loadAllHierarchicalRequirements,
		    scope: this
		}).then({
		    success: function(usRecords){
		        //console.log('User Stories Records: ', usRecords);
		        for(var i=0; i<usRecords.length; i++){
		            var feature = this.featureArtifactColl[i];
		            this.featureUserStoriesMappingColl.push({
		                key: feature,
		                value: usRecords[i]
		            });
		        }
		        
		        //console.log('Feature Artifacts & US Mapping: ', this.featureUserStoriesMappingColl);
		        //console.log('Milestone Collection: ', this.milestoneColl);
		        //console.log('Milestone Artifact Mapping: ', this.milestoneArtifactMappingColl);
		        
		        this._loadMilestoneUserStoriesFromMapping();
		        
		        //console.log('Milestone Userstories Mapping: ', this.milestoneUserStoriesMappingColl);
		        //console.log('Milestone with features without child Mapping: ', this.milestoneFeatureWithoutChildrenCountMappingColl);
		        
		        this._createMilestoneDataModelForDisplay();
		        
		        console.log('Filtered Milestone Data: ', this.filteredMilestoneDataCollection);
		        
		        this._organiseMilestoneBasedOnValuestream(this.filteredMilestoneDataCollection);
		        
		    },
		    failure: function(error){
		        console.log('Error loading milestones!');
		    },
		    scope: this
		});
    },
    
    _createMilestoneDataModelForDisplay: function(){
        var that = this;
        
        _.each(this.milestoneUserStoriesMappingColl, function(milestoneUSRec){
            var milestoneRec = milestoneUSRec.key;
            var usRecColl = milestoneUSRec.value;
            
            var featuresWithoutChildrenCount = that._getCountOfMilestoneFeaturesWithoutChildren(milestoneRec);
            var milestoneComputeResult = that._performAllMilestoneComputaion(usRecColl, featuresWithoutChildrenCount);
            
            var isValid = that._isMilestoneValidForDisplay(milestoneRec, milestoneComputeResult);
            
            if(isValid){
                var milestoneCustomData = that._createCustomMilestoneData(milestoneRec, milestoneComputeResult);
                that.filteredMilestoneDataCollection.push(milestoneCustomData);
            }
        });
    },
    
    _organiseMilestoneBasedOnValuestream : function(filteredMilestonesArr) {
		this.valueStreamMilestoneColl = [];
		this.valueStreamColl = [];
		var nonVSCount = 0;
		var that = this;

		Ext.Array.each(filteredMilestonesArr, function(thisData) {
			var valuestream = thisData.get('ValueStream');

			if (valuestream !== null && valuestream !== '') {
				if (that.valueStreamColl.length === 0) {
					that.valueStreamColl.push(valuestream);
				} else if (that.valueStreamColl.length > 0 && that.valueStreamColl.indexOf(valuestream) === -1) {
					that.valueStreamColl.push(valuestream);
				}
			} else {
				nonVSCount++;
			}
		});

		this.valueStreamColl.sort();
		//console.log('VS: coll', this.valueStreamColl);

		if (nonVSCount > 0) {
			this.valueStreamColl.push('N/A');
		}

		Ext.Array.each(this.valueStreamColl, function(valuestream) {
			var milestoneColl = that._getAllAssociatedMilestones(valuestream, filteredMilestonesArr);

			that.valueStreamMilestoneColl.push({
				key : valuestream,
				value : milestoneColl
			});
		});

		this._createValueStreamMilestonesTreeNode();
	},
	
	_createValueStreamMilestonesTreeNode : function() {

		var valueStreamRootNode = Ext.create('MilestoneTreeModel', {
			Name : 'ValueStream Root',
			text : 'ValueStream Root',
			root : true,
			expandable : true,
			expanded : true
		});

		this._createValueStreamNodesAlongWithAssociatedChildMilestoneNodes(valueStreamRootNode);

		this._createValueStreamMilestoneGrid(valueStreamRootNode);

	},
	
	_createValueStreamNodesAlongWithAssociatedChildMilestoneNodes : function(valustreamRootNode) {
		var that = this;

		Ext.Array.each(this.valueStreamMilestoneColl, function(thisData) {
			var valueStreamNode = that._createValueStreamNode(thisData.key);

			Ext.Array.each(thisData.value, function(thisMilestoneData) {
				var milestoneNode = that._createMilestoneNode(thisMilestoneData);
				valueStreamNode.appendChild(milestoneNode);
			});

			valustreamRootNode.appendChild(valueStreamNode);
		});
	},
	
	_createValueStreamNode : function(valuestreamData) {
		var valueStreamLable = 'valuestream: ' + valuestreamData;
		var valustreamTreeNode = Ext.create('MilestoneTreeModel', {
			Name : valueStreamLable,
			AcceptedLeafStoryCount : '',
			LeafStoryCount : '',
			StoryProgressPercent : '',
			leaf : false,
			expandable : true,
			expanded : true,
			iconCls : 'no-icon'
		});

		return valustreamTreeNode;
	},

	_createMilestoneNode : function(milestoneData) {
		//console.log('Percentage Done rec: ', milestoneData.get('StoryProgressPercent').toString());
		var targetProjectName = milestoneData.get('TargetProject') !== null ? milestoneData.get('TargetProject')._refObjectName : 'Global';

		var milestoneTreeNode = Ext.create('MilestoneTreeModel', {
			ObjectID : milestoneData.get('ObjectID'),
			FormattedID : milestoneData.get('FormattedID'),
			Name : milestoneData.get('Name'),
			StartDate : milestoneData.get('StartDate'),
			ActiveStartDate : milestoneData.get('ActiveStartDate'),
			TargetDate : milestoneData.get('TargetDate'),
			TargetProject : targetProjectName,
			DisplayColor : milestoneData.get('DisplayColor'),
			Notes : milestoneData.get('Notes'),
			AdditionalReferences : milestoneData.get('AdditionalReferences'),
			AssociatedTeams : milestoneData.get('AssociatedTeams'),
			_ref : milestoneData.get('_ref'),
			AcceptedLeafStoryCount : milestoneData.get('AcceptedLeafStoryCount').toString(),
			LeafStoryCount : milestoneData.get('LeafStoryCount').toString(),
			StoryProgressPercent : milestoneData.get('StoryProgressPercent').toString(),
			FeaturesWithoutChildrenCount : milestoneData.get('FeaturesWithoutChildrenCount').toString(),
			leaf : true,
			expandable : false,
			expanded : false,
			iconCls : 'no-icon'
		});

		return milestoneTreeNode;
	},
	
	_getAllAssociatedMilestones : function(valuestream, milestoneStoreData) {
		var milestoneColl = [];

		Ext.Array.each(milestoneStoreData, function(milestone) {
			var vsRecord = milestone.get('ValueStream');
			vsRecord = (vsRecord !== null && vsRecord !== '') ? vsRecord : 'N/A';

			if (vsRecord === valuestream) {
				milestoneColl.push(milestone);
			}
		});

		return milestoneColl;
	},
	
	_createValueStreamMilestoneGrid : function(valueStreamRootNode) {
		console.log('createValueStreamMilestoneGrid calling.....');
		var milestonesTreePanel = Ext.getCmp('milestonesTreePanel');

		if (milestonesTreePanel)
			milestonesTreePanel.destroy();

		var me = this;
		var milestoneValueStreamTreeStore = Ext.create('Ext.data.TreeStore', {
			model : 'MilestoneTreeModel',
			root : valueStreamRootNode
		});

		this.chartDiag = Ext.create('Rally.ui.dialog.Dialog', {
			autoShow : false,
			draggable : false,
			closable : true,
			closeAction : 'hide',
			padding : 10,
			width : 800,
			height : 500,
			autoScroll : true,
			id : 'Burnup_Chart_Diag'
		});
		this.chartDiag.hide();

		var valuestreamMilestoneTreePanel = Ext.create('Ext.tree.Panel', {
			id : 'milestonesTreePanel',
			itemId : 'milestonesTreePanel',
			store : milestoneValueStreamTreeStore,
			useArrows : true,
			rowLines : true,
			displayField : 'Name',
			rootVisible : false,
			width : this.getWidth(true),
			height : this.getHeight(true), // Extra scroll for individual sections:
			viewConfig : {
				getRowClass : function(record, index) {
					var nameRecord = Ext.String.format("{0}", record.get('Name'));
					if (nameRecord && nameRecord.search('valuestream:') === -1) {
						return 'row-child';
					}
					return 'row-parent';
				}
			},
			columns : [ {
				xtype : 'treecolumn',
				text : 'Name',
				dataIndex : 'Name',
				resizeable : true,
				flex : 3,
				minWidth : 200,
				//width : 300,
				renderer : function(value, style, item, rowIndex) {
					var link = Ext.String.format("{0}", value);
					if (link.search('valuestream:') === -1) {
						var ref = item.get('_ref');
						link = Ext.String.format("<a target='_top' href='{1}'><b>{0}</b></a>", value, Rally.nav.Manager.getDetailUrl(ref));
					} else {
						var onlyName = link.replace('valuestream:', '');
						link = Ext.String.format("<b>{0}</b>", onlyName);
					}

					return link;
				}
			}, {
				text : 'Project',
				dataIndex : 'TargetProject',
				flex : 2,
				hidden : true
			}, {
				text : 'Start Date',
				dataIndex : 'StartDate',
				flex : 1,
				renderer : function(value) {
					if (value) {
						//format date field to only show month and year
						return Rally.util.DateTime.format(value, 'm/d/Y');
					}
				},
				hidden : true
			}, {
				text : 'Target Date',
				dataIndex : 'TargetDate',
				flex : 1,
				renderer : function(value) {
					if (value) {
						//format date field to only show month and year
						var formattedDate = Rally.util.DateTime.format(value, 'M Y');
						var formattedField;
						//change color for dates in the past
						if (value < new Date()) {
							formattedField = Ext.String.format("<div style='color:grey'>{0}</div>", formattedDate);
							return formattedField;
						} else {
							formattedField = Ext.String.format("<div>{0}</div>", formattedDate);
						}

						return formattedField;
					}
				}
			}, {
				xtype : 'templatecolumn',
				text : 'Progress',
				dataIndex : 'StoryProgressPercent',
				tooltip : 'click to view details.',
				tpl : Ext.create('Rally.ui.renderer.template.progressbar.ProgressBarTemplate', {
					percentDoneName : 'StoryProgressPercent',
					showOnlyIfInProgress : true,
					showDangerNotificationFn : function(value) {
						if (value.FeaturesWithoutChildrenCount > 0)
							return true;
						else
							return false;
					},
					calculateColorFn : function(value) {
						//console.log('inside calculateColorFn.....value: ', value);
						var targetDate = value.TargetDate;
						var per = 0;
						var colorHex = '#77D38D';
						if (value.StoryProgressPercent && targetDate) {
							per = parseFloat(value.StoryProgressPercent);
							colorHex = me._getPercentDoneColor(targetDate, value.StartDate, value.StoryProgressPercent);
						}
						//console.log('color in hex: ', colorHex);
						return colorHex;
					}
				}),
				flex : 1
			}, {
				text : 'Accepted Count',
				dataIndex : 'AcceptedLeafStoryCount',
				flex : 1
			}, {
				text : 'Story Count',
				dataIndex : 'LeafStoryCount',
				flex : 1
			}, {
				text : 'Status',
				dataIndex : 'DisplayColor',
				flex : 1,
				hidden : true,
				renderer : function(value) {
					if (value) {
						var colorHtml = Ext.String.format("<div class= 'color-box' style= 'background-color: {0};'></div>", value);
						return colorHtml;
					}
				}
			},{
				text : 'Teams',
				dataIndex : 'AssociatedTeams',
				flex : 1
			}, {
				text : 'Notes',
				dataIndex : 'Notes',
				flex : 4
			}, {
				xtype : 'actioncolumn',
				text : 'References',
				width : 50,
				items : [ {
					icon : 'https://cdn3.iconfinder.com/data/icons/fatcow/16x16_0620/page_link.png', // Use a URL in the icon config
					tooltip : 'References',
					getClass: this._displayIconForRow,
					width : 75,
					handler : function(grid, rowIndex, colIndex) {
						var record = grid.getStore().getAt(rowIndex);
						if (record.get('FormattedID') !== null && record.get('FormattedID') !== "") {
							var dialogTitle = record.get('FormattedID') + ': Additional References';
							if (record.get('AdditionalReferences') !== null && record.get('AdditionalReferences') !== '') {
								var chartDiag = Ext.create('Rally.ui.dialog.Dialog', {
									autoShow : true,
									draggable : false,
									closable : true,
									closeAction : 'destroy',
									padding : 10,
									width : 800,
									title : dialogTitle
								});
								//me._getMilestoneBurnupChart(r, chartDiag);
							} else {
								Ext.Msg.alert(dialogTitle, 'Sorry! There are NO reference mentioned.');
							}
						} else {
							Ext.Msg.alert("Reference", 'No Reference is available for valuestream item. Please click on individual milstone reference icon to get the references.');
						}

					}
				} ]
			},
			{
				xtype : 'actioncolumn',
				text : 'Chart',
				width : 50,
				items : [ {
					icon : 'https://cdn4.iconfinder.com/data/icons/6x16-free-application-icons/16/3d_bar_chart.png', // Use a URL in the icon config
					tooltip : 'Burnup Chart',
					getClass: this._displayIconForRow,
					width : 75,
					handler : function(grid, rowIndex, colIndex) {
						var record = grid.getStore().getAt(rowIndex);
						if (record.get('FormattedID') !== null && record.get('FormattedID') !== "") {
							var dialogTitle = record.get('FormattedID') + ': Burnup Chart';
							me.chartDiag.setTitle(dialogTitle);
							me.chartDiag.removeAll(true);
							me.chartDiag.show();
							me._getMilestoneBurnupChart(record, me.chartDiag);
						} else {
							Ext.Msg.alert("Burnup Chart", 'No Chart is available for valuestream item. Please click on individual milstone chart icon to get the chart.');
						}

					}
				} ]

			} ]
		});

		valuestreamMilestoneTreePanel.on({
			cellclick : {
				fn : this._onTreePanelItemClick,
				scope : this
			}
		});

		var gridContainer = this.getComponent('gridContainer');
		if (gridContainer !== null) {
			gridContainer.removeAll();
			gridContainer.add(valuestreamMilestoneTreePanel);
		}
		
		Ext.getBody().unmask();
	},
	
	_displayIconForRow: function(v, metadata, r, rowIndex, colIndex, store){
		var name = r.get('Name');
		var className = 'hide-icon';
		if (name.search('valuestream:') === -1) {
			className = 'show-icon';
		}
		
		return className;
	},
    
    _isMilestoneValidForDisplay: function(milestoneRec, milestoneComputeResult){
        var isValid = true;
        
        var storyInfo = milestoneComputeResult.storyInfo;
        var projColl = milestoneComputeResult.projectColl;
        var targetDate = milestoneRec.get('TargetDate');
        
        if((storyInfo.storyCount > 0 && storyInfo.storyCount === storyInfo.acceptedCount) && (targetDate !== '' && targetDate <= new Date())){
            isValid = false;
        }
        
        //console.log('StoryInfo filter is ' + isValid + ' for Milestone: ', milestoneRec);
        
        if(isValid){
            var teamPickerSelected = this._getTeamFilterSelectionValue(); 				//'/project/3874483234,/project/2508024112'; 
            if(teamPickerSelected !== null && teamPickerSelected !== undefined && teamPickerSelected !== '')
            	isValid = this._isMilestoneDataAssociatedWitheSelectedTeams(teamPickerSelected, projColl);
        }
        
        //console.log('Team selection filter is ' + isValid + ' for Milestone: ', milestoneRec);
        
        return isValid;
    },
    
    _getTeamFilterSelectionValue: function(){
        var teamPickerSelected = this.getSetting('teamPicker');
        
	 	if(this.selectedMultiTeamFilter !== null && this.selectedMultiTeamFilter !== undefined && this.selectedMultiTeamFilter !== ''){
			teamPickerSelected = this.selectedMultiTeamFilter;
		}
		
		return teamPickerSelected;
    },
    
    _isMilestoneDataAssociatedWitheSelectedTeams: function(teamPickerSelection, associatedProj){
		var isPresent = false;
		var associatedProjRef = this._getAssociatedProjectRefColl(associatedProj);
		
		//console.log('associatedProj Ref coll: ', associatedProjRef);
		if(associatedProjRef === null || associatedProjRef === undefined)
			return true;
		
		var teamFilters = teamPickerSelection.split(',');
		//console.log('team filter: ', teamFilters);
		
		if(teamFilters.length > 0 && associatedProjRef !== null && associatedProjRef !== undefined && associatedProjRef.length > 0){
			for (var i = 0; i < teamFilters.length; i++) 
			{
				if(associatedProjRef.indexOf(teamFilters[i]) > -1){
					isPresent = true;
					break;
				}
			}
		}
		
		return isPresent;
	},
	
	_getAssociatedProjectNameCollString: function(projColl){
		var nameColl = [];
		Ext.Array.each(projColl,function(thisProject) {
		    if(!_.contains(nameColl, thisProject.Name))
		    	nameColl.push(thisProject.Name);
		});
		
		var nameStr = '';
		Ext.Array.each(nameColl, function(thisProjectName) {
		    nameStr = nameStr + thisProjectName + ',';
		});
		
		return (nameStr !== '' && nameStr.length > 1) ? nameStr.substring(0, nameStr.length-1) : nameStr;
	},
	
	_getAssociatedProjectRefColl: function(projColl){
		var refColl = [];
		Ext.Array.each(projColl,function(thisProject) {
		    if(!_.contains(refColl, thisProject._ref))
		    	refColl.push(thisProject._ref);
		});
		
		return refColl;
	},
    
    _getCountOfMilestoneFeaturesWithoutChildren: function(milestone){
        var count = 0;
        _.each(this.milestoneFeatureWithoutChildrenCountMappingColl, function(milestoneCollRec){
            var milestoneRec = milestoneCollRec.key;
            var noChildCount = milestoneCollRec.value;
            
            if(milestoneRec.get('ObjectID') === milestone.get('ObjectID')){
               count = (noChildCount !== null && noChildCount !== undefined) ? noChildCount : 0;
               return;
            }
        });
        
        return count;
    },
    
    _performAllMilestoneComputaion: function(usColl, featureWithoutChildCount){
        var milestoneStoryInfo = {
            storyInfo: [],
            projectColl: []
        };
        
        var storyCountInfo = {
			storyCount : 0,
			acceptedCount : 0,
			startDate : null,
			featureNotBrokenCount : featureWithoutChildCount
		};
		
		var projColl = [];
		
		var leafStoryCount = 0, acceptedLeafStoryCount = 0, startDate = null;
		
		 _.each(usColl, function(us){
		     leafStoryCount += 1;
		     
		     var scheduleState = us.get('ScheduleState');
		     if (scheduleState === 'Accepted') {
				acceptedLeafStoryCount += 1;
			 }
			 
			 var inProgressDate = us.get('InProgressDate');

			if (startDate === null || startDate > inProgressDate) {
				startDate = inProgressDate;
			}
			
			var proj = us.get('Project');
            if(proj !== null && !_.contains(projColl, proj)){
                projColl.push(proj);
            }
		 });
        
        storyCountInfo.storyCount = leafStoryCount;
        storyCountInfo.acceptedCount = acceptedLeafStoryCount;
        storyCountInfo.startDate = startDate;
        
        milestoneStoryInfo.storyInfo = storyCountInfo;
        milestoneStoryInfo.projectColl = projColl;
        
        return milestoneStoryInfo;
    },
    
    _getAllProjectsAssociatedWithMilestone: function(usColl){
        var projColl = [];
        _.each(usColl, function(us){
            var proj = us.get('Project');
            if(proj !== null && !_.contains(projColl, proj)){
                projColl.push(proj);
            }
        });
        
        return projColl;
    },
    
    _createCustomMilestoneData : function(milestoneItem, milestoneComputeResult) {
        var storyCountInfo = milestoneComputeResult.storyInfo;
        var projColl = milestoneComputeResult.projectColl;
        var projectNameList = this._getAssociatedProjectNameCollString(projColl);
        
		var milestoneData = Ext.create('MilestoneDataModel', {
			ObjectID : milestoneItem.get('ObjectID'),
			FormattedID : milestoneItem.get('FormattedID'),
			Name : milestoneItem.get('Name'),
			StartDate : storyCountInfo.startDate,
			ActiveStartDate : milestoneItem.get('c_ActiveStartDate'),
			TargetDate : milestoneItem.get('TargetDate'),
			TargetProject : milestoneItem.get('Name'),
			ValueStream : milestoneItem.get('c_ValueStream'),
			AdditionalReferences : milestoneItem.get('c_AdditionalReferences'),
			Visibility : milestoneItem.get('c_ExecutiveVisibility'),
			Status : milestoneItem.get('c_Test'),
			DisplayColor : milestoneItem.get('DisplayColor'),
			Notes : milestoneItem.get('Notes'),
			_ref : milestoneItem.get('_ref'),
			AssociatedTeams: projectNameList,
			AcceptedLeafStoryCount : storyCountInfo.acceptedCount,
			LeafStoryCount : storyCountInfo.storyCount,
			FeaturesWithoutChildrenCount : storyCountInfo.featureNotBrokenCount,
			StoryProgressPercent : storyCountInfo.storyCount > 0 ? (storyCountInfo.acceptedCount / storyCountInfo.storyCount) : 0
		});

		return milestoneData;
	},
    
    _loadMilestoneUserStoriesFromMapping: function(){
        var that = this;
        
        _.each(this.milestoneArtifactMappingColl, function(milestoneArtifactCollRec){
            var userStoriesColl = [];
            var milestoneRec = milestoneArtifactCollRec.key;
            var artifactColl = milestoneArtifactCollRec.value;
            
            if(artifactColl.length > 0){
                var featureWithoutChildCount = 0;
                var me = that;
                _.each(artifactColl, function(artifact) {
                    var itemType = artifact.get('_type');
			        if (itemType !== 'hierarchicalrequirement' && itemType !== 'defect'){
			            
			            if (artifact.get('LeafStoryCount') === 0) {
    						featureWithoutChildCount += 1;
    					}
			            
			            var usColl = me._getUserStoriesForFeatures(artifact);
			            
			            _.each(usColl, function(us) {
			                userStoriesColl.push(us);
			            });
			        }
			        else{
			            //console.log('Found a direct Association of type: ' + itemType);
			            //console.log('Direct Associated Artifact is: ', artifact);
			            userStoriesColl.push(artifact);
			        }
                });
            }
            
            that.milestoneFeatureWithoutChildrenCountMappingColl.push({
                key: milestoneRec,
                value: featureWithoutChildCount
            });
            
            that.milestoneUserStoriesMappingColl.push({
                key: milestoneRec,
                value: userStoriesColl
            });
            
        });
    },
    
    _getUserStoriesForFeatures: function(artifact){
        var usColl = [];
        _.each(this.featureUserStoriesMappingColl, function(featureUSRec){
            var feature = featureUSRec.key;
            var userStoriesColl = featureUSRec.value;
            
            if(feature.get('ObjectID') === artifact.get('ObjectID')){
                usColl = userStoriesColl;
                return;
            }
        });
        
        return usColl;
    },
    
    _createMilestoneStoreFilter : function() {
		this.projectMilestoneFilter = Ext.create('Rally.data.wsapi.Filter', {
			property : 'TargetDate',
			operator : '>=',
			value : 'today-15'
		});

		//only apply filtering on the notes field if configured
		if (this._getVisibilityFilter()) {
			this.projectMilestoneFilter = this.projectMilestoneFilter.and(Ext.create('Rally.data.wsapi.Filter', {
				property : 'c_ExecutiveVisibility',
				operator : '=',
				value : this._getVisibilityFilter()
			}));
		}

		//only filter on date range if configured
		if (this.getSetting('showNumberOfMonths') && this.getSetting('showNumberOfMonths') > 0) {
			var endDate = Rally.util.DateTime.add(new Date(), "month", this.getSetting('showNumberOfMonths'));

			this.projectMilestoneFilter = this.projectMilestoneFilter.and(Ext.create('Rally.data.wsapi.Filter', {
				property : 'TargetDate',
				operator : '<=',
				value : endDate
			}));
		}

		var vsSelectedValues = this.getSetting('valueStreamPicker');
		var vsFilters = vsSelectedValues.split(',');
		//console.log('valuesteam settings value: ', vsFilters);

		this.projectMilestoneFilter = this.projectMilestoneFilter.and(Ext.create('Rally.data.wsapi.Filter', {
			property : 'c_ValueStream',
			operator : 'contains',
			value : vsFilters[0]
		}));
		if (vsFilters.length > 1) {
			for (var i = 1; i < vsFilters.length; i++) {
				this.projectMilestoneFilter = this.projectMilestoneFilter.or(Ext.create('Rally.data.wsapi.Filter', {
					property : 'c_ValueStream',
					operator : 'contains',
					value : vsFilters[i]
				}));
			}
		}
	},
	
	_loadArtifacts : function(milestoneRecords) {
		var promises = [];
		var that = this;
		this.milestoneColl = milestoneRecords;

		Ext.Array.each(milestoneRecords, function(milestone) {

			var artifactStore = Ext.create('Rally.data.wsapi.artifact.Store', {
				models : [ 'portfolioitem/feature', 'defect', 'userstory' ],
				context : {
					workspace : that.getContext().getWorkspace()._Ref,
					project : null,
					limit : Infinity,
					projectScopeUp : false,
					projectScopeDown : true
				},
				filters : [ {
					property : 'Milestones.ObjectID',
					operator : '=',
					value : milestone.get('ObjectID')
				} ]
			});

			promises.push(artifactStore.load());

		});

		return Deft.Promise.all(promises);
	},
	
	_loadAllHierarchicalRequirements : function(artifactCollRecs) {
	    //console.log('Artifacts collection: ', artifactCollRecs);
	    
	    for(var i=0; i < artifactCollRecs.length; i++){
	        var milestone = this.milestoneColl[i];
	        
	        this.milestoneArtifactMappingColl.push({
	            key: milestone,
	            value: artifactCollRecs[i]
	        });
	    }
	    
	    var artifactColl = _.flatten(artifactCollRecs);
	    this.featureArtifactColl = [];
		var promises = [];
		var that = this;

		Ext.Array.each(artifactColl, function(artifact) {
			var itemType = artifact.get('_type');
			if (itemType == 'hierarchicalrequirement' || itemType == 'defect') {
				var project = artifact.get('Project');
				if (project && _.contains(that.allAssociatedProjectColl, project))
					that.allAssociatedProjectColl.push(project);
			} 
			else 
			{
			    that.featureArtifactColl.push(artifact);
			    
				var hierarchicalrequirementStore = Ext.create('Rally.data.wsapi.Store', {
					model : 'HierarchicalRequirement',
					fetch : [ 'ObjectID', 'FormattedID', 'Name', 'Project', 'Feature', 'ScheduleState'],
					context : {
						workspace : that.getContext().getWorkspace()._Ref,
						project : null,
						limit : Infinity,
						projectScopeUp : false,
						projectScopeDown : true
					},
					filters : [ {
						property : 'Feature.ObjectID',
						operator : '=',
						value : artifact.get('ObjectID')
					} ]
				});

				promises.push(hierarchicalrequirementStore.load());
			}

		});

		return Deft.Promise.all(promises);
	},
	
	_getVisibilityFilter : function() {
		var visibilityCheckBox = Ext.getCmp('executiveVisibilityCheckbox');
		return visibilityCheckBox.getValue();
		//return true;
	},
	
	/*============================= For Milestone Progress Tooltip =========================================================*/

	_onTreePanelItemClick : function(view, td, cellIndex, record, tr, rowIndex) {

		if (cellIndex === 4) {
			console.log('In side the Progress bar cell');
			console.log('On Cell Click: Data Model is : ', record);

			var tooltipTitle = '<h3>' + record.data.FormattedID + ' : ' + record.data.Name + '</h3>';

			var htmlString = this._getTootipPopupContent(record);

			var tooltip = Ext.create('Rally.ui.tooltip.ToolTip', {
				target : td,
				//html: htmlString,
				anchor : 'left',
				items : [ {
					xtype : 'label',
					forId : 'myFieldId',
					html : tooltipTitle,
					margin : '10 10 10 10'
				}, {
					xtype : 'form',
					bodyPadding : 10,
					layout : 'fit',
					items : [ {
						xtype : 'displayfield',
						fieldLabel : 'Details',
						hideLabel : true,
						name : 'progress_details',
						value : htmlString,
						autoScroll : true
					} ]
				} ],
				layout : {
					type : 'vbox',
					align : 'left'
				}
			});

			console.log('Tool Tip: ', tooltip);
		}

	},

	_getTootipPopupContent : function(record) {
		var progressPercentage = (record.data.StoryProgressPercent.toFixed(2) * 100);
		var htmlstring = '<h3>Progress:</h3>';
		htmlstring += '<p>Total Story Count: <span><strong>' + record.data.LeafStoryCount + '</strong></span></p>';
		htmlstring += '<p>Total Accepted Story Count: <span><strong>' + record.data.AcceptedLeafStoryCount + '</strong></span></p>';
		htmlstring += '<p>Percentage of Progress: <span><strong>' + progressPercentage + ' %</strong></span></p>';
		htmlstring += '<hr>';

		if (record.data.FeaturesWithoutChildrenCount > 0) {
			htmlstring += '<h3 style="color:red;">Alerts:</h3>';
			htmlstring += '<p style="color:red; font-weight: bold;">There are <span><u>' + record.data.FeaturesWithoutChildrenCount + 
			' Features</u></span> still not broken down into user stories.</p>';
			htmlstring += '<hr>';
		}

		var targetDate = record.data.TargetDate !== null ? Rally.util.DateTime.format(record.data.TargetDate, 'm/d/Y') : 'Not Mentioned';
		var actualStartDate = record.data.StartDate !== null ? Rally.util.DateTime.format(record.data.StartDate, 'm/d/Y') : 'Not Started';
		htmlstring += '<h3>Info:</h3>';
		htmlstring += '<p>Milestone Target Date: <span><strong>' + targetDate + '</strong></p>';
		htmlstring += '<p>Milestone Actual Start Date: <span><strong>' + actualStartDate + '</strong></p>';
		htmlstring += '<hr>';

		htmlstring += '<h3>Notes: <h3>';
		htmlstring += '<p style="width: 100px; white-space: pre-line;">' + record.data.Notes + '</p>';

		return htmlstring;
	},

	_onTreePanelItemMouseEnter : function(view, record, item, index) {
		console.log('On Mouse Enter: record is : ', record);
		console.log('On Mouse Enter: column is : ', item);
		console.log('On Mouse Enter: index is : ', index);
	},

	//uses Rally's algorithm to calculate percent done color
	_getPercentDoneColor : function(milestoneEndDate, milestoneStartDate, milestonePercentDone) {
		var greenHex = '#1B801D', yellowHex = '#FFFF00', redHex = '#FE2E2E', blueHex = '#1874CD', whiteHex = '#FFFFFF';

		var startDate = null, endDate = null;
		var asOfDate = new Date();
		var percentComplete = 100 * milestonePercentDone;

		//set start date to the when the milestone started or today (if not started yet)
		if (milestoneStartDate !== null) {
			startDate = milestoneStartDate;
		} else {
			startDate = asOfDate;
		}

		//set end date when the milestone ends or today (if end date not set)
		if (milestoneEndDate !== null) {
			endDate = milestoneEndDate;
		} else {
			endDate = asOfDate;
		}

		//get date differences
		var dateDifference = Rally.util.DateTime.getDifference(endDate, startDate, 'day');

		var startDateNumber = 1;
		var endDateNumber = startDateNumber + dateDifference;
		var asOfDateNumber = Rally.util.DateTime.getDifference(asOfDate, startDate, 'day') + 1;

		//delays could be configurable
		var acceptanceStartDelay = (endDateNumber - startDateNumber) * 0.2;
		var warningDelay = (endDateNumber - startDateNumber) * 0.2;
		var inProgress = percentComplete > 0;

		//Today is before the start date
		if (asOfDate < startDate) {
			return whiteHex;
		}

		//if the end date is in the past
		if (asOfDate >= endDate) {
			if (percentComplete >= 100.0) {
				return blueHex;
			}

			return redHex;
		}

		//calculate red threshold
		var redXIntercept = startDateNumber + acceptanceStartDelay + warningDelay;
		var redSlope = 100.0 / (endDateNumber - redXIntercept);
		var redYIntercept = -1.0 * redXIntercept * redSlope;
		var redThreshold = redSlope * asOfDateNumber + redYIntercept;

		//if percent done does not exceed threshold, return red
		if (percentComplete < redThreshold) {
			return redHex;
		}

		//calculate yellow threshold
		var yellowXIntercept = startDateNumber + acceptanceStartDelay;
		var yellowSlope = 100 / (endDateNumber - yellowXIntercept);
		var yellowYIntercept = -1.0 * yellowXIntercept * yellowSlope;
		var yellowThreshold = yellowSlope * asOfDateNumber + yellowYIntercept;

		//if percent done does not exceed threshold, return yellow
		if (percentComplete < yellowThreshold) {
			return yellowHex;
		}

		return greenHex;
	},
	
	/*========================= BurnUp Chart============================================================*/

	_getMilestoneBurnupChart : function(milestoneRec, chartDiag) {
		var chartDiagId = chartDiag.getId();

		if (milestoneRec !== null) {
			//console.log('milestoneData: ', milestoneRec);

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
					chartDiag.add(burnupChart);

					var that = this;

					Ext.Array.each(this.piRecords, function(piRecord, index) {
						var piBurnupChart = that._getChart(false, piRecord, chartDiag);

						if (piBurnupChart !== null) {
							/*if(index == 0) {
								chartDiag.add({title : 'Scroll down for feature level burnup'});
							}*/
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
		return Ext.create('Rally.data.wsapi.Store', {
			model : 'TypeDefinition',
			autoLoad : true,
			fetch : [ 'TypePath' ],
			filters : [ {
				property : 'Parent.Name',
				value : 'Portfolio Item'
			}, {
				property : 'Ordinal',
				value : 0
			} ]
		}).load().then(
				{
					success : function(records) {
						this.piType = records[0].get('TypePath');
						return Ext.create(
								'Rally.data.wsapi.Store',
								{
									model : this.piType,
									fetch : [ 'ObjectID', 'FormattedID', 'Project', 'Name', 'PreliminaryEstimate', 'ActualStartDate', 'PlannedEndDate', 'AcceptedLeafStoryPlanEstimateTotal',
											'LeafStoryPlanEstimateTotal' ],
									filters : [ {
										property : 'Milestones.ObjectID',
										operator : '=',
										value : this.selectedMilestone
									//TODO: Need to Populate this
									} ],
									context : {
										project : null
									},
									limit : Infinity
								}).load().then({
							success : function(piRecords) {
								this.piRecords = piRecords;
							},
							scope : this
						});
					},
					scope : this
				});
	},

	_getChart : function(isMileStone, piRecord, chartDiag) {
		var that = this;

		var chartStartDate = that.selectedMilestoneObj.get('ActiveStartDate') !== '' ? that.selectedMilestoneObj.get('ActiveStartDate') : _.min(_.compact(_.invoke(that.piRecords, 'get',
				'ActualStartDate')));
		var chartEndDate = that.selectedMilestoneObj.get('TargetDate');

		/*var chartStartDate = _.isEmpty(_.compact(_.invoke(that.selectedMilestoneObj, 'get', 'ActiveStartDate'))) ? _.min(_.compact(_.invoke(that.piRecords, 'get', 'ActualStartDate'))) : _.first(_.compact(_.invoke(that.selectedMilestoneObj, 'get', 'ActiveStartDate'))); 
		var chartEndDate = _.first(_.compact(_.invoke(that.selectedMilestoneObj, 'get', 'TargetDate')));*/

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
	 * Generate the store config to retrieve all snapshots for all leaf child
	 * stories of the specified PI
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
			context : this.getContext().getDataContext(),
			limit : Infinity
		};
	},

	/**
	 * Generate the store config to retrieve all snapshots for all leaf child
	 * stories of a specified PI
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
			context : this.getContext().getDataContext(),
			limit : Infinity
		};
	},

	/**
	 * Generate a valid Highcharts configuration object to specify the chart
	 */

	_getChartConfig : function(isMileStone, piRecord) {
		return {
			chart : {
				defaultSeriesType : 'area',
				zoomType : 'xy'
			},
			title : {
				text : isMileStone ? 'Milestone Burnup' : piRecord.data.FormattedID + ' - ' + piRecord.data.Name
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