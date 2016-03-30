Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    launch: function() {
        
        //this._loadPIsInMilestone();
        
        //this._loadAllUSinMilestoneUsingDeft();
        
        this._loadAllMilestones();
    },
    
    _loadAllMilestones: function(){
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
		
		milsetoneStore.load().then({
		    success: this._loadArtifacts,
		    scope: this
		}).then({
		    success: this._loadAllHierarchicalProjects,
		    scope: this
		}).then({
		    success: function(usRecords){
		        console.log('User Stories Records: ', usRecords);
		        for(var i=0; i<usRecords.length; i++){
		            var feature = this.featureArtifactColl[i];
		            this.featureUserStoriesMappingColl.push({
		                key: feature,
		                value: usRecords[i]
		            });
		        }
		        
		        console.log('Feature Artifacts & US Mapping: ', this.featureUserStoriesMappingColl);
		        console.log('Milestone Collection: ', this.milestoneColl);
		        console.log('Milestone Artifact Mapping: ', this.milestoneArtifactMappingColl);
		    },
		    failure: function(error){
		        console.log('Error loading milestones!');
		    },
		    scope: this
		});
    },
    
    _createMilestoneStoreFilter : function() {
		this.projectMilestoneFilter = Ext.create('Rally.data.wsapi.Filter', {
			property : 'TargetDate',
			operator : '>=',
			value : 'today-15'
		});
		
		this.projectMilestoneFilter = this.projectMilestoneFilter.and(Ext.create('Rally.data.wsapi.Filter', {
			property : 'c_ValueStream',
			operator : 'contains',
			value : 'FPA'
		}));
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
	
	_loadAllHierarchicalProjects : function(artifactCollRecs) {
	    console.log('Artifacts collection: ', artifactCollRecs);
	    
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

			//console.log('loading project of Artifiact: ', artifact);
			var itemType = artifact.get('_type');
			//console.log('loading project of Artifact Type: ', itemType);
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
					fetch : [ 'ObjectID', 'FormattedID', 'Name', 'Project', 'Feature' ],
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
	
	_loadTypeDefs: function(milestones){
	    var that = this;
	    milestones = _.flatten(milestones);
	    var promises = [];
	    _.each(milestones, function(milestone){
	        that.selectedMilestone = milestone.get('ObjectID');
	        console.log('Milestone ID: ', that.selectedMilestone);
	        
	        var typeDefn = Ext.create('Rally.data.wsapi.Store', {
                  model : 'TypeDefinition',
                  autoLoad : true,
                  fetch : [ 'TypePath' ],
                  filters : [ {
                        property : 'Parent.Name',
                        value : 'Portfolio Item'            //Portfolio Item
                  }, {
                        property : 'Ordinal',
                        value : 0
                  } ]
            });
            
            promises.push(typeDefn.load());
	    });
	    
	    return Deft.Promise.all(promises);
	},
    
    _loadAllUSinMilestoneUsingDeft: function(milestone){
        this.selectedMilestone = milestone.get('ObjectID');
        var typeDefn = Ext.create('Rally.data.wsapi.Store', {
                  model : 'TypeDefinition',
                  autoLoad : true,
                  fetch : [ 'TypePath' ],
                  filters : [ {
                        property : 'Parent.Name',
                        value : 'Portfolio Item'            //Portfolio Item
                  }, {
                        property : 'Ordinal',
                        value : 0
                  } ]
            });
            
            typeDefn.load().then({
                success: this._loadPIs,
                scope: this
            }).then({
                success: this._loadUserStories,
                scope: this
            }).then({
                success: function(userstories){
                    userstories = _.flatten(userstories);
                    console.log('All userstories: ', userstories);
                    
                    this.milestoneUserStoriesColl.push({
                        key: milestone,
                        value: userstories
                    });
                    
                    console.log('Milestones US coll: ', this.milestoneUserStoriesColl);
                },
                failure: function(error){
                    console.log("oh noes!");
                },
                scope: this
            });
    },
    
    _loadPIs: function(typeDefRecords){
        typeDefRecords = _.flatten(typeDefRecords);
        console.log('Type Def Records: ', typeDefRecords);
        this.piType = typeDefRecords[0].get('TypePath');
        //console.log('PI Type: ', this.piType);
        
        var promises = [];
        var piStore = Ext.create('Rally.data.wsapi.Store', {
                      model : this.piType,
                      fetch : [ 'ObjectID', 'Project', 'Name', 'ActualStartDate', 'PlannedEndDate', 'AcceptedLeafStoryPlanEstimateTotal', 'LeafStoryPlanEstimateTotal', 'UserStories'],
                      filters : [ {
                            property : 'Milestones.ObjectID',
                            operator : '=',
                            value : this.selectedMilestone
                      } ],
                      context : {
                            project : null
                      },
                      limit : Infinity
                });
        promises.push(piStore.load());
        
        return Deft.Promise.all(promises);
    },
    
    _loadUserStories: function(piRecords){
        console.log('PI Records: ', piRecords);
        piRecords = _.flatten(piRecords);
        
        var promises = [];
        _.each(piRecords, function(pi){
            var userstoriesStore = pi.getCollection('UserStories');
            if(userstoriesStore !== null){
                promises.push(userstoriesStore.load());
            }
        });
        
        return Deft.Promise.all(promises);
    },
    
    /**
     * ================================================================================================================
     *
     */
    _loadPIsInMilestone : function() {
            var that = this;
            this.selectedMilestone = '51405357097';
            
            return Ext.create('Rally.data.wsapi.Store', {
                  model : 'TypeDefinition',
                  autoLoad : true,
                  fetch : [ 'TypePath' ],
                  filters : [ {
                        property : 'Parent.Name',
                        value : 'Portfolio Item'            //Portfolio Item
                  }, {
                        property : 'Ordinal',
                        value : 0
                  } ]
            }).load().then({
                  success : function(records) {
                        console.log('Type Def Records: ', records);
                        this.piType = records[0].get('TypePath');
                        console.log('PI Type: ', this.piType);
                        
                        return Ext.create('Rally.data.wsapi.Store', {
                              model : this.piType,
                              fetch : [ 'ObjectID', 'Project', 'Name', 'ActualStartDate', 'PlannedEndDate', 'AcceptedLeafStoryPlanEstimateTotal', 'LeafStoryPlanEstimateTotal', 'UserStories'],
                              filters : [ {
                                    property : 'Milestones.ObjectID',
                                    operator : '=',
                                    value : this.selectedMilestone
                              } ],
                              context : {
                                    project : null
                              },
                              limit : Infinity
                        }).load().then({
                              success : function(piRecords) {
                                   var that = this;
                                   console.log('PI records: ', piRecords);
                                    
                                    this.associatedPiProjects = [];
                                    Ext.Array.each(piRecords, function(thisPi){
                                        that.currPi = thisPi;
                                        
                                        return thisPi.getCollection('UserStories').load().then({
                                            success : function(usRecords) {
                                                var me = that;
                                                that.associatedProjects = []; 
                                                
                                                console.log('US records: ', usRecords);
                                                Ext.Array.each(usRecords, function(thisUs) {
                                                    var proj = thisUs.get('Project');
                                                    if(proj !== null && proj !== '' && !_.contains(me.associatedProjects, proj.Name))
                                                        me.associatedProjects.push(proj.Name);
                                                });
                                                console.log('Projects records: ', that.associatedProjects);
                                            },
                                            scope : that
                                        }).then({
                                            success: function(){
                                                that.associatedPiProjects.push({
                                                    key: that.currPi,
                                                    value: that.associatedProjects
                                                });
                                                
                                                console.log('PI Projects records: ', that.associatedPiProjects);
                                            },
                                            scope: that
                                        });
                                    });
                              },
                              scope : this
                        });
                  },
                  scope : this
            });
      },
      
      loadUserStories: function(){
        Ext.create('Rally.data.wsapi.Store', {
            model : 'UserStory',
            filters : [
                {
                    property : 'Milestones',
                    operator : 'contains',
                    value : "milestone/51405357097" 
                }
            ],
            fetch : [ 'ObjectID', 'FormattedID', 'Project', 'Name'],
            limit : Infinity,
            autoLoad : true,
            listeners : {
                load : function(store, records) {
                    console.log(records);
                }
            }
        });
    }
});