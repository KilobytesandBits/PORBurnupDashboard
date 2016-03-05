var types = Ext.data.Types;
Ext.define('MilestoneTreeModel', {
	extend: 'Ext.data.TreeModel',
	fields: [
	            {name: 'ObjectID', mapping: 'ObjectID', type: types.STRING},
                {name: 'FormattedID', mapping: 'FormattedID', type: types.STRING},
                {name: 'Name', mapping: 'Name', type: types.STRING},
                {name: 'StartDate', mapping: 'ActualStartDate', type: types.DATE },
                {name: 'ActiveStartDate', mapping: 'ActiveStartDate', type: types.DATE },
                {name: 'TargetDate', mapping: 'AcceptedDate', type: types.DATE },
                {name: 'TargetProject', mapping: 'TargetProject', type: types.OBJECT},
                {name: 'ValueStream', mapping: 'ValueStream', type: types.STRING},
                {name: 'Visibility', mapping: 'Visibility', type: types.STRING},
                {name: 'Status', mapping: 'Status', type: types.STRING},
                {name: 'DisplayColor', mapping: 'DisplayColor', type: types.STRING},
                {name: 'Notes', mapping: 'Notes', type: types.STRING},
                {name: '_ref', mapping: '_ref', type: types.STRING},
                {name: 'AcceptedLeafStoryCount', mapping: 'AcceptedLeafStoryCount', type: types.STRING},
                {name: 'LeafStoryCount', mapping: 'LeafStoryCount', type: types.STRING},
                {name: 'FeaturesWithoutChildrenCount', mapping: 'FeaturesWithoutChildrenCount', type: types.INT},
                {name: 'StoryProgressPercent', mapping: 'StoryProgressPercent', type: types.FLOAT}
            ],
    hasMany: {model: 'FeatureTreeModel', name:'features', associationKey: 'features'}
});

Ext.define('MilestoneDataModel', {
    extend: 'Ext.data.Model',
    fields: [
                {name: 'ObjectID', mapping: 'ObjectID', type: types.STRING},
                {name: 'FormattedID', mapping: 'FormattedID', type: types.STRING},
                {name: 'Name', mapping: 'Name', type: types.STRING},
                {name: 'ActiveStartDate', mapping: 'ActiveStartDate', type: types.DATE },
                {name: 'StartDate', mapping: 'ActualStartDate', type: types.DATE },
                {name: 'TargetDate', mapping: 'AcceptedDate', type: types.DATE },
                {name: 'TargetProject', mapping: 'TargetProject', type: types.OBJECT},
                {name: 'ValueStream', mapping: 'ValueStream', type: types.STRING},
                {name: 'Visibility', mapping: 'Visibility', type: types.STRING},
                {name: 'Status', mapping: 'Status', type: types.STRING},
                {name: 'DisplayColor', mapping: 'DisplayColor', type: types.STRING},
                {name: 'Notes', mapping: 'Notes', type: types.STRING},
                {name: '_ref', mapping: '_ref', type: types.STRING},
                {name: 'AcceptedLeafStoryCount', mapping: 'AcceptedLeafStoryCount', type: types.INT},
                {name: 'LeafStoryCount', mapping: 'LeafStoryCount', type: types.INT},
                {name: 'FeaturesWithoutChildrenCount', mapping: 'FeaturesWithoutChildrenCount', type: types.INT},
                {name: 'StoryProgressPercent', mapping: 'StoryProgressPercent', type: types.FLOAT}
            ]
});


Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    config: {
        defaultSettings: { 
            valueStreamPicker: 'FPA, Integration'
        }
    },
    
    getSettingsFields: function() {
        return [
            {
                name: 'includeGlobalMilestones',
                xtype: 'rallycheckboxfield',
                fieldLabel: '',
                boxLabel: 'Include global milestones'
            },
            {
                name: 'showNumberOfMonths',
                xtype: 'rallynumberfield',
                fieldLabel: 'Date Range (months)'
            },
           {
                name: 'valueStreamPicker',
                xtype: 'rallyfieldvaluecombobox',
                model: 'Milestone',
                field: 'c_ValueStream',
                fieldLabel: 'Value Stream',
                allowNoEntry: true,
                multiSelect: true
            }
        ];
    },
    
    items: [
        {
            xtype:"container", 
            itemId:"filterContainer", 
            id:"filterContainer"
        },
        {
            xtype:"container",
            itemId:"gridContainer",
            id:"gridContainer" 
        }
    ],
    
    launch: function() {
        
        this.down('#filterContainer').add({
            xtype: 'rallycheckboxfield',
            id: 'executiveVisibilityCheckbox',
            boxLabel: 'Show Executive Visibility Only',
            labelWidth: 200,
            padding: '10, 5, 10, 5',
            checked: false,
            listeners: {
                change: this._onReady,
                render: this._onReady,
                scope: this
            }
        });
    },
    
    _onReady: function() {
        
        this._getAllChildProjectsForCurrentProject(this.project);
    },
    
    _getAllChildProjectsForCurrentProject: function(currProject){
        Ext.getBody().mask('Loading...');
        
        this.allProjectsList = [];
        var that = this;
        var projectStore = Ext.create('Rally.data.wsapi.Store', {
            model: 'Project',
            fetch: ['Name', 'State', 'Parent', 'Children'],
            autoLoad: true,
            compact: false,
            context: {
                workspace: that.getContext().getWorkspace()._Ref,
                projectScopeUp: false,
                projectScopeDown: true
            },
            limit: Infinity,
            filters:[{
                property:'State',
                operator: '=',
                value: 'Open'
            }],
            sorters: [{
                property: 'Name',
                direction: 'ASC'
            }],
            listeners: {
                load: function(projectStore, data, success){
                    //initiatilinzing the list containing the required and all projects.
                    this.requiredProjectsList = [];
                    this.allProjectsColl = data;
                    
                    //identifying the selected project and constructing its reference.
                    var selectedProj = this.getContext().getProject();
                    var selectedProjRef = '/project/' + selectedProj.ObjectID;
                        
                    //registering the selected project reference.
                    this.requiredProjectsList.push(selectedProj.ObjectID);
                        
                    //identifying whether selected project has any children.
                    var selectedProjChildren = selectedProj.Children;
                    if(selectedProjChildren && selectedProjChildren.Count > 0){
                        this._loadAllChildProjectsFromParent(selectedProjRef);
                    }
                    
                    console.log('creating the milestone Store Filter...');
                    //creating the milestone Store Filter.
                    this._createMilestoneStoreFilter();
                    
                     console.log('creating Milestone store.');
                    //creating Milestone store.
                    this._createMilestoneStore();
                    
                    
                },
                scope: this
            }
         });
    },
    
    _loadAllChildProjectsFromParent: function(parentProjRef) {
        var that = this;
        
        Ext.Array.each(this.allProjectsColl, function(thisProject) {
            //identifying current project is child of the Project with reference..
            if(thisProject.get('Parent') && thisProject.get('Parent')._ref !== null && thisProject.get('Parent')._ref == parentProjRef){
                that.requiredProjectsList.push(thisProject.data.ObjectID);
                
                //identifying whether the project as any further children.
                var projChildren = thisProject.get('Children');
                if(projChildren && projChildren.Count > 0){
                    that._loadAllChildProjectsFromParent(thisProject.get('_ref'));
                }
            }
        });
    },
    
    _createMilestoneStoreFilter: function(){
        this.projectMilestoneFilter =  Ext.create('Rally.data.wsapi.Filter', {
                                    property: 'TargetDate',
                                    operator: '>=',
                                    value: 'today-15'
                                });
        
        //only apply filtering on the notes field if configured
        if (this._getVisibilityFilter()) {
            this.projectMilestoneFilter = this.projectMilestoneFilter.and(Ext.create('Rally.data.wsapi.Filter', {
                                    property: 'c_ExecutiveVisibility',
                                    operator: '=',
                                    value: this._getVisibilityFilter()
                                }));
        }
        
        //only filter on date range if configured
        if (this.getSetting('showNumberOfMonths') && this.getSetting('showNumberOfMonths') > 0) {
            var endDate = Rally.util.DateTime.add(new Date(), "month", this.getSetting('showNumberOfMonths'));
            
            this.projectMilestoneFilter = this.projectMilestoneFilter.and(Ext.create('Rally.data.wsapi.Filter', {
                property: 'TargetDate',
                operator: '<=',
                value: endDate
            }));
        }
        
        var vsSelectedValues = this.getSetting('valueStreamPicker');
        var vsFilters = vsSelectedValues.split(',');
        console.log('valuesteam settings value: ', vsFilters);
        
        this.projectMilestoneFilter =this.projectMilestoneFilter.and(Ext.create('Rally.data.wsapi.Filter', {
                                                                property: 'c_ValueStream',
                                                                operator: 'contains',
                                                                value: vsFilters[0]
                                                            })); 
        if(vsFilters.length > 1){
            for(var i=1; i<vsFilters.length; i++){
                this.projectMilestoneFilter = this.projectMilestoneFilter.or(Ext.create('Rally.data.wsapi.Filter', {
                                                                property: 'c_ValueStream',
                                                                operator: 'contains',
                                                                value: vsFilters[i]
                                                            }));
            }
        }
        
        console.log('valuesteam settings filter: ', this.projectMilestoneFilter);
        
        /*if(this.getSetting('valueStreamPicker') && this.getSetting('valueStreamPicker') !== null){
            
            this.projectMilestoneFilter = this.projectMilestoneFilter.and(Ext.create('Rally.data.wsapi.Filter', {
                property: 'c_ValueStream',
                operator: 'contains',
                value: this.getSetting('valueStreamPicker')
            }));
            
            //Need to include milestones without Value Stream also.
            this.projectMilestoneFilter = this.projectMilestoneFilter.or(Ext.create('Rally.data.wsapi.Filter', {
                property: 'c_ValueStream',
                operator: 'contains',
                value: ''
            }));
        }*/
    },
    
    _createMilestoneStore: function() {

        Ext.create("Rally.data.wsapi.Store", {
            model: 'milestone',
            autoLoad: true,
            compact: false,
            listeners: {
                load: function(store, data, success) {
                    this._filterMileStones(data);
                },
                scope: this
            },
            filters : this.projectMilestoneFilter,
            sorters: [
                {
                    property: 'c_ValueStream',
                    direction: 'ASC'
                },
                {
                    property: 'TargetDate',
                    direction: 'ASC'
                }
            ]
        }); 
    },
    
    //Only include milestones based on the current project and it's children
    _filterMileStones: function(milestones) {
        var that = this;
        
        //Filter out milestone will be stored here
        var filteredMilestonesArr = [];
        
        Ext.each(milestones, function(milestone, index) {
            
            if (milestone.data.TargetProject !== null && milestone.data.TargetProject !== "" && (that.requiredProjectsList.indexOf(milestone.data.TargetProject.ObjectID) > -1)) {
                filteredMilestonesArr.push(milestone);
            }
            
            //If including global milestones, get milestones where TargetProject is not specific as well
            if (that.getSetting('includeGlobalMilestones') && milestone.data.TargetProject === null){
                filteredMilestonesArr.push(milestone);
            }
        });
        
        this._loadArtifactsForMilestones(filteredMilestonesArr);
        //this._organiseMilestoneBasedOnValuestream(filteredMilestonesArr);
    },
    
    _loadArtifactsForMilestones: function(milestoneArr){
        var that = this;
        //console.log('inside _loadArtifactsForMilestones.....');
        //console.log('imilestone records: ', milestoneArr);
        
        this._loadArtifacts(milestoneArr).then({
                success: function(records){
                    that.milestoneDataArray = [];
                    
                    Ext.Array.each(records, function(record, index){
                        //console.log('print milestone recs: ', record);
                        //console.log('print milestone index: ', index);
                        //console.log('milestone array: ', milestoneArr);
                        
                        var storyCountInfo = that._computeArtifactsAssociation(record);
                        //console.log('Milestone: [',  that.milestoneNameList[index] + '] has : (', storyCountInfo.acceptedCount + '/', storyCountInfo.storyCount + ') stories done.');
                        var milestoneRec = milestoneArr[index];
                        
                        var milestoneCustomData = that._createCustomMilestoneData(milestoneRec, storyCountInfo);
                        that.milestoneDataArray.push(milestoneCustomData);
                    });
                    
                    //console.log('Milestone Artifact Data list: ', that.milestoneDataArray);
                    
                    that._organiseMilestoneBasedOnValuestream(that.milestoneDataArray);
                },
                failure: function(error){
                    console.log('There are some errors');
                    Ext.getBody().unmask();
                },
            scope: that
            });
    },
    
    _createCustomMilestoneData: function(milestoneItem, storyCountInfo){
        var milestoneData = Ext.create('MilestoneDataModel', {
            ObjectID : milestoneItem.get('ObjectID'),
            FormattedID : milestoneItem.get('FormattedID'),
            Name: milestoneItem.get('Name'),
            StartDate: storyCountInfo.startDate,
            ActiveStartDate: milestoneItem.get('c_ActiveStartDate'),
            TargetDate : milestoneItem.get('TargetDate'),
            TargetProject : milestoneItem.get('Name'),
            ValueStream: milestoneItem.get('c_ValueStream'),
            Visibility: milestoneItem.get('c_ExecutiveVisibility'),
            Status: milestoneItem.get('c_Test'),
            DisplayColor: milestoneItem.get('DisplayColor'),
            Notes: milestoneItem.get('Notes'),
            _ref: milestoneItem.get('_ref'),
            AcceptedLeafStoryCount: storyCountInfo.acceptedCount,
            LeafStoryCount: storyCountInfo.storyCount,
            FeaturesWithoutChildrenCount: storyCountInfo.featureNotBrokenCount,
            StoryProgressPercent: storyCountInfo.storyCount > 0 ? (storyCountInfo.acceptedCount/storyCountInfo.storyCount) : 0
        });
        
        return milestoneData;
    },
    
    _loadArtifacts: function(milestoneList){
        var promises = [];
        var that = this;
        
        Ext.Array.each(milestoneList, function(milestone){
            
            var artifactStore = Ext.create('Rally.data.wsapi.artifact.Store', {
                    models: ['portfolioitem/feature', 'defect', 'userstory'],
                    context: {
                        workspace: that.getContext().getWorkspace()._Ref,
                        project: null,
                        limit: Infinity,
                        projectScopeUp: false,
                        projectScopeDown: true
                    },
                    filters: [
                        {
                            property: 'Milestones.ObjectID',
                            operator: '=',
                            value: milestone.get('ObjectID')
                        }
                    ]
            });
            
            promises.push(that._loadArtifactStore(artifactStore));
            
        });
        
        return Deft.Promise.all(promises);
    },
    
    _loadArtifactStore: function(store){
        var deferred;
        deferred = Ext.create('Deft.Deferred');
        
        store.load({
                callback: function(records, operation, success) {
                  if (success) {
                    deferred.resolve(records);
                  } else {
                    deferred.reject("Error loading Companies.");
                  }
                }
            });
            
        return deferred.promise;
    },
    
    _computeArtifactsAssociation: function(artifactColl){
        var storyCountInfo = {
            storyCount: 0,
            acceptedCount: 0,
            startDate: null,
            featureNotBrokenCount: 0
        };
        var leafStoryCount = 0, acceptedLeafStoryCount = 0, startDate = null, featuresWithoutChildren = 0;
        
        if(artifactColl.length > 0){
            Ext.Array.each(artifactColl, function(item){
                var itemType = item.get('_type');
                var scheduleState = item.get('ScheduleState');
                
                if (itemType == 'hierarchicalrequirement' || itemType == 'defect') {
                    leafStoryCount += 1;
                    
                    if (scheduleState == 'Accepted') {
                        acceptedLeafStoryCount += 1;   
                    }
                    
                    var inProgressDate = item.get('InProgressDate');
                    
                    if (startDate === null || startDate > inProgressDate) {
                        startDate = inProgressDate;    
                    }
                }
                else {
                    
                    if(item.get('LeafStoryCount') === 0){
                        featuresWithoutChildren += 1;
                    }
                    else{
                        leafStoryCount += item.get('LeafStoryCount');
                        acceptedLeafStoryCount += item.get('AcceptedLeafStoryCount');
                    }
                    
                    var portfolioStartDate = item.get('ActualStartDate');
                        
                    if (startDate === null || startDate > portfolioStartDate) {
                        startDate = portfolioStartDate;    
                    }
                }
            });
        }
        
        storyCountInfo.storyCount = leafStoryCount;
        storyCountInfo.acceptedCount = acceptedLeafStoryCount;
        storyCountInfo.featureNotBrokenCount = featuresWithoutChildren;
        
        if (startDate !== null) {
            storyCountInfo.startDate = startDate;    
        }
        
        return storyCountInfo;
    },
    
    _organiseMilestoneBasedOnValuestream: function(filteredMilestonesArr){
        this.valueStreamMilestoneColl = [];
        this.valueStreamColl = [];
        var nonVSCount = 0;
        var that = this;
        
        Ext.Array.each(filteredMilestonesArr, function(thisData){
            var valuestream = thisData.get('ValueStream');
            
            if(valuestream !== null && valuestream !== ''){
                if(that.valueStreamColl.length === 0){
                    that.valueStreamColl.push(valuestream);
                }
                else if(that.valueStreamColl.length > 0 && that.valueStreamColl.indexOf(valuestream) === -1){
                    that.valueStreamColl.push(valuestream);
                }
            }
            else{
                nonVSCount++;
            }
        });
        
        this.valueStreamColl.sort();
         //console.log('VS: coll', this.valueStreamColl);
        
        if(nonVSCount > 0) {
            this.valueStreamColl.push('N/A');
        }
        
        Ext.Array.each(this.valueStreamColl, function(valuestream) {
            var milestoneColl = that._getAllAssociatedMilestones(valuestream, filteredMilestonesArr);
            
            that.valueStreamMilestoneColl.push({
                key: valuestream,
                value: milestoneColl
            });
        });
        
        //console.log('Milestone by VS: ', this.valueStreamMilestoneColl);
        
        this._createValueStreamMilestonesTreeNode();
    },
    
    _createValueStreamMilestonesTreeNode: function(){
        
        var valueStreamRootNode = Ext.create('MilestoneTreeModel',{
                    Name: 'ValueStream Root',
                    text: 'ValueStream Root',
                    root: true,
                    expandable: true,
                    expanded: true
                });
                
        this._createValueStreamNodesAlongWithAssociatedChildMilestoneNodes(valueStreamRootNode);
        
        //console.log('milestone tree node: ', valueStreamRootNode);
        
        this._createValueStreamMilestoneGrid(valueStreamRootNode);
        
    },
    
    _createValueStreamMilestoneGrid: function(valueStreamRootNode){
        var milestonesTreePanel = Ext.getCmp('milestonesTreePanel');
        
        if (milestonesTreePanel)
            milestonesTreePanel.destroy();
        
       var me = this;
       var milestoneValueStreamTreeStore = Ext.create('Ext.data.TreeStore', {
            model: 'MilestoneTreeModel',
            root: valueStreamRootNode
        }); 
        
       var valuestreamMilestoneTreePanel = Ext.create('Ext.tree.Panel', {
           id: 'milestonesTreePanel',
           itemId: 'milestonesTreePanel',
            store: milestoneValueStreamTreeStore,
            useArrows: true,
            rowLines: true,
            displayField: 'Name',
            rootVisible: false,
            width: this.getWidth(true),
            height: this.getHeight(true), // Extra scroll for individual sections:
            viewConfig: {
                getRowClass: function(record, index) {
                    var nameRecord = Ext.String.format("{0}", record.get('Name'));
                    if(nameRecord && nameRecord.search('valuestream:') === -1){
                        return 'row-child';
                    }
                    return 'row-parent';
                }
            },
            columns: [{
                          xtype: 'treecolumn',
                          text: 'Name',
                          dataIndex: 'Name',
                          resizeable: true,
                          flex: 3,
                          minWidth:200,
                          //width : 300,
                          renderer: function(value,style,item,rowIndex) {
                                var link = Ext.String.format("{0}", value);
                                if(link.search('valuestream:') === -1){
                                    var ref = item.get('_ref');
                                    link = Ext.String.format("<a target='_top' href='{1}'><b>{0}</b></a>", value, Rally.nav.Manager.getDetailUrl(ref));
                                }
                                else{
                                    var onlyName = link.replace('valuestream:', '');
                                    link= Ext.String.format("<b>{0}</b>", onlyName);
                                }
                                    
                                return link;
                            }
                    },
                    {
                        text: 'Project', 
                        dataIndex: 'TargetProject',
                        flex: 2,
                        hidden: true
                    },
                    {
                        text: 'Start Date', 
                        dataIndex: 'StartDate',
                        flex: 1,
                        renderer: function(value) {
                            if(value) {
                                //format date field to only show month and year
                                return Rally.util.DateTime.format(value, 'm/d/Y');
                            }
                        },
                        hidden: true
                    },
                    {
                        text: 'Target Date', 
                        dataIndex: 'TargetDate',
                        flex: 1,
                        renderer: function(value){
                            if(value) {
                                //format date field to only show month and year
                                var formattedDate = Rally.util.DateTime.format(value, 'M Y');
                                var formattedField;
                                //change color for dates in the past
                                if (value < new Date()) {
                                    formattedField = Ext.String.format("<div style='color:grey'>{0}</div>", formattedDate);
                                    return formattedField;
                                }
                                else {
                                    formattedField = Ext.String.format("<div>{0}</div>", formattedDate);
                                }
                                
                                return formattedField;
                            }
                        }
                    },
                    {
                        xtype: 'templatecolumn',
                        text: 'Progress',
                        dataIndex: 'StoryProgressPercent',
                        tooltip: 'click to view details.',
                        tpl: Ext.create('Rally.ui.renderer.template.progressbar.ProgressBarTemplate', {
                             percentDoneName: 'StoryProgressPercent',
                             showOnlyIfInProgress: true,
                             showDangerNotificationFn: function(value){
                                if(value.FeaturesWithoutChildrenCount > 0)
                                    return true;
                                else
                                    return false;
                             },
                             calculateColorFn: function(value){
                                 //console.log('inside calculateColorFn.....value: ', value);
                                 var targetDate = value.TargetDate;
                                 var per = 0;
                                 var colorHex = '#77D38D';
                                 if(value.StoryProgressPercent && targetDate){
                                     per = parseFloat(value.StoryProgressPercent);
                                     colorHex = me._getPercentDoneColor(targetDate, value.StartDate, value.StoryProgressPercent);
                                 }
                                 //console.log('color in hex: ', colorHex);
                                 return colorHex;
                             }
                        }),
                        flex: 1
                    },
                    {
                        text: 'Accepted Count',
                        dataIndex: 'AcceptedLeafStoryCount',
                        flex: 1
                    },
                    {
                        text: 'Story Count',
                        dataIndex: 'LeafStoryCount',
                        flex: 1
                    },
                    {
                        text: 'Status',
                        dataIndex: 'DisplayColor',
                        flex: 1,
                        hidden: true,
                        renderer: function(value){
                            if(value){ 
                                var colorHtml = Ext.String.format("<div class= 'color-box' style= 'background-color: {0};'></div>", value);
                                return colorHtml;
                            }
                        }
                    },
                    {
                        text: 'Notes',
                        dataIndex: 'Notes',
                        flex: 4
                    },
                    /*{
                        xtype:'actioncolumn',
                        text: 'Notes',
                        flex: 2,
                        items: [{
                            icon: 'https://cdn3.iconfinder.com/data/icons/developerkit/png/View.png',  // Use a URL in the icon config
                            width: 75,
                            tooltip: 'View',
                            handler: function(grid, rowIndex, colIndex) {
                                var columnIndex = me._getColumnIndex(grid, 'Notes');
                                if(colIndex == columnIndex){
                                    //popup window code.
                                    var record = grid.getStore().getAt(rowIndex);
                                    me._displayNotesDailog(record);
                                }
                            }
                        }]
                    },*/
                    /*{
                        text: 'Notes',
                        flex: 2,
                        renderer: function (v, m, r) {
                            var id = Ext.id();
                            //console.log('milestone id: ',r.get('FormattedID'));
                            if(r.get('FormattedID') !== '' && r.get('Notes') !== ''){
                                Ext.defer(function () {
                                    Ext.widget('rallybutton', {
                                        renderTo: id,
                                        text: 'View ' + r.get('FormattedID') + ' Notes',
                                        width: 150,
                                        handler: function () { 
                                            Ext.Msg.alert('Info', r.get('Notes')); 
                                        }
                                    });
                                }, 50);
                            }
                            return Ext.String.format('<div id="{0}"></div>', id);
                        }
                    },*/
                    {
                        text: 'Charts',
                        flex: 2,
                        renderer: function (v, m, r) {
                            var id = Ext.id();
                            //console.log('milestone record: ',r);
                            if(r.get('FormattedID') !== ''){
                                Ext.defer(function () {
                                    Ext.widget('rallybutton', {
                                        renderTo: id,
                                        text: 'View ' + r.get('FormattedID') + ' Burnup',
                                        width: 150,
                                        handler: function () { 
                                            var dialogTitle = r.get('FormattedID') + ': Burnup Chart';
                                            var chartDiag = Ext.create('Rally.ui.dialog.Dialog', {
                                                 autoShow: true,
                                                 draggable: false,
                                                 closable: true,
                                                 closeAction: 'destroy',
                                                 padding: 10,
                                                 width: 800,
                                                 title: dialogTitle
                                             });
                                            me._getMilestoneBurnupChart(r, chartDiag);
                                        }
                                    });
                                }, 50);
                            }
                            return Ext.String.format('<div id="{0}"></div>', id);
                        }
                    }
                ]
        });
        
        valuestreamMilestoneTreePanel.on({
            cellclick: {fn: this._onTreePanelItemClick, scope: this}
        });
        
        this.down('#gridContainer').add(valuestreamMilestoneTreePanel);
        
        Ext.getBody().unmask();
    },
    
    
    /*============================= For Milestone Notes Dailog ============================================================*/
    
     _getColumnIndex: function(grid, headerName){
        var gridColumns = grid.headerCt.getGridColumns();
        for(var i=0;i<gridColumns.length; i++){
            if(gridColumns[i].text == headerName){
                return i;
            }
        }
    },
    
    _getFieldText: function(fieldValue, defaultValue) {
        return _.isUndefined(fieldValue) || _.isNull(fieldValue) ? defaultValue : fieldValue;
    },
    
    _displayNotesDailog: function(recordData){
        Ext.create('Rally.ui.dialog.RichTextDialog', {
                 autoShow: true,
                 title: 'Milestone Note(s)',
                 record: recordData,
                 fieldName: 'Notes',
                 height: 350,
                 width: 550,
                 closable: true
             });
    },
    
    
    /*============================= For Milestone Progress Tooltip =========================================================*/
    
     _onTreePanelItemClick: function(view, td, cellIndex, record, tr, rowIndex){
         
        if(cellIndex === 4){
            console.log('In side the Progress bar cell');
            console.log('On Cell Click: Data Model is : ', record);
            
            var tooltipTitle = '<h3>' + record.data.FormattedID + ' : ' + record.data.Name + '</h3>';
            
            var htmlString = this._getTootipPopupContent(record);
            
            var tooltip = Ext.create('Rally.ui.tooltip.ToolTip', {
                    target : td,
                    //html: htmlString,
                    anchor: 'left',
                    items: [
                        {
                            xtype: 'label',
                            forId: 'myFieldId',
                            html: tooltipTitle,
                            margin: '10 10 10 10'
                        },
                        {
                            xtype : 'form',
                            bodyPadding: 10,
                            layout: 'fit',
                            items: [{
                                xtype: 'displayfield',
                                fieldLabel: 'Details',
                                hideLabel: true,
                                name: 'progress_details',
                                value: htmlString,
                                autoScroll: true
                            }]
                        }],
                    layout: {
                        type: 'vbox',
                        align: 'left'
                    }
                });
                
            console.log('Tool Tip: ', tooltip);
        }
        
    },
    
    _getTootipPopupContent: function(record){
        var progressPercentage = (record.data.StoryProgressPercent.toFixed(2) * 100);
        var htmlstring = '<h3>Progress:</h3>';
        htmlstring += '<p>Total Story Count: <span><strong>' + record.data.LeafStoryCount + '</strong></span></p>';
        htmlstring += '<p>Total Accepted Story Count: <span><strong>' + record.data.AcceptedLeafStoryCount + '</strong></span></p>';
        htmlstring += '<p>Percentage of Progress: <span><strong>' + progressPercentage + ' %</strong></span></p>';
        htmlstring += '<hr>';
        
        if(record.data.FeaturesWithoutChildrenCount > 0){
            htmlstring += '<h3 style="color:red;">Alerts:</h3>';
            htmlstring += '<p style="color:red; font-weight: bold;">There are <span><u>' + record.data.FeaturesWithoutChildrenCount + ' Features</u></span> still not broken down into user stories.</p>';
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
    
    _onTreePanelItemMouseEnter: function(view, record, item, index){
        console.log('On Mouse Enter: record is : ', record);
        console.log('On Mouse Enter: column is : ', item);
        console.log('On Mouse Enter: index is : ', index);
    },

    //uses Rally's algorithm to calculate percent done color
    _getPercentDoneColor: function(milestoneEndDate, milestoneStartDate, milestonePercentDone) {
        var greenHex = '#1B801D', yellowHex = '#FFFF00', redHex = '#FE2E2E', blueHex = '#1874CD', whiteHex = '#FFFFFF';
        
        var startDate = null, endDate = null;
        var asOfDate = new Date();
        var percentComplete = 100 * milestonePercentDone;
        
        //set start date to the when the milestone started or today (if not started yet)
        if (milestoneStartDate !== null) {
            startDate = milestoneStartDate;
        }
        else {
            startDate = asOfDate;
        }
        
        //set end date when the milestone ends or today (if end date not set)
        if (milestoneEndDate !== null) {
            endDate = milestoneEndDate;    
        }
        else {
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
    
    _createValueStreamNodesAlongWithAssociatedChildMilestoneNodes: function(valustreamRootNode){
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
    
    _createValueStreamNode: function(valuestreamData){
        var valueStreamLable = 'valuestream: ' + valuestreamData;
        var valustreamTreeNode = Ext.create('MilestoneTreeModel',{
                    Name: valueStreamLable,
                    AcceptedLeafStoryCount: '',
                    LeafStoryCount: '',
                    StoryProgressPercent: '',
                    leaf: false,
                    expandable: true,
                    expanded: true,
                    iconCls :'no-icon'
                });
                
        return  valustreamTreeNode;
    },
    
    _createMilestoneNode: function(milestoneData){
        //console.log('Percentage Done rec: ', milestoneData.get('StoryProgressPercent').toString());
        var targetProjectName = milestoneData.get('TargetProject') !== null ?  milestoneData.get('TargetProject')._refObjectName : 'Global';
        
        var milestoneTreeNode = Ext.create('MilestoneTreeModel',{
            ObjectID : milestoneData.get('ObjectID'),
            FormattedID: milestoneData.get('FormattedID'),
            Name: milestoneData.get('Name'),
            StartDate: milestoneData.get('StartDate'),
            ActiveStartDate: milestoneData.get('ActiveStartDate'),
            TargetDate: milestoneData.get('TargetDate'),
            TargetProject: targetProjectName,
            DisplayColor: milestoneData.get('DisplayColor'),
            Notes: milestoneData.get('Notes'),
            _ref: milestoneData.get('_ref'),
            AcceptedLeafStoryCount: milestoneData.get('AcceptedLeafStoryCount').toString(),
            LeafStoryCount: milestoneData.get('LeafStoryCount').toString(),
            StoryProgressPercent: milestoneData.get('StoryProgressPercent').toString(),
            FeaturesWithoutChildrenCount: milestoneData.get('FeaturesWithoutChildrenCount').toString(),
            leaf: true,
            expandable: false,
            expanded: false,
            iconCls :'no-icon'
        });
        
        return milestoneTreeNode;
    },
    
    _getAllAssociatedMilestones: function(valuestream, milestoneStoreData){
        var milestoneColl = [];
        
        Ext.Array.each(milestoneStoreData, function(milestone) {
            var vsRecord = milestone.get('ValueStream');
            vsRecord = (vsRecord !== null && vsRecord !== '') ? vsRecord : 'N/A';
            
            if(vsRecord === valuestream){
                milestoneColl.push(milestone);
            }
        });
        
        return milestoneColl;
    },
    
    _getVisibilityFilter: function() {
        var visibilityCheckBox = Ext.getCmp('executiveVisibilityCheckbox');
        return visibilityCheckBox.getValue();
        //return true;
    },
    
    /*========================= BurnUp Chart============================================================*/
    
    _getMilestoneBurnupChart: function(milestoneRec, chartDiag){
        if(milestoneRec !== null){
            console.log('milestoneData: ', milestoneRec);
            
            this.selectedMilestone = milestoneRec.get('ObjectID');
    		this.selectedMilestoneObj = milestoneRec;
    		
    		this._getBurnupChart(chartDiag);
        }
    },
    
    /**
	 * Create the burnup chart and draw it
	 */
	_getBurnupChart : function(chartDiag) {

		Deft.Promise.all([ this._loadPIsInMilestone(), this._loadScheduleStateValues() ]).then({
			success : function() {
				var burnupChart = this._getChart();
				
				if(burnupChart !== null){
				    chartDiag.removeAll(true);
				    chartDiag.add(burnupChart);
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
		}).load().then({
			success : function(records) {
				this.piType = records[0].get('TypePath');
				return Ext.create('Rally.data.wsapi.Store', {
					model : this.piType,
					fetch : [ 'ObjectID', 'Project', 'Name', 'PreliminaryEstimate', 'ActualStartDate', 'PlannedEndDate', 'AcceptedLeafStoryPlanEstimateTotal', 'LeafStoryPlanEstimateTotal' ],
					filters : [ {
						property : 'Milestones.ObjectID',
						operator : '=',
						value : this.selectedMilestone                  //TODO: Need to Populate this
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

	_getChart : function() {
		var that = this;

		//console.log("_.invoke(that.selectedMilestoneObj, 'get', 'ActiveStartDate')", _.compact(_.invoke(that.selectedMilestoneObj, 'get', 'ActiveStartDate')));
		//console.log("_.invoke(that.selectedMilestoneObj, 'get', 'ActiveStartDate')", (_.isEmpty(_.compact(_.invoke(that.selectedMilestoneObj, 'get', 'ActiveStartDate')))));
		//console.log("that.piRecords",that.piRecords);
		
	    console.log('selectedMilestoneObj: ', that.selectedMilestoneObj);
	    console.log('ActiveStartDate: ', that.selectedMilestoneObj.get('ActiveStartDate'));
	    console.log('ActualStartDate: ', _.min(_.compact(_.invoke(that.piRecords, 'get', 'ActualStartDate'))));
	    
		var chartStartDate = that.selectedMilestoneObj.get('ActiveStartDate') !== '' ? that.selectedMilestoneObj.get('ActiveStartDate') : _.min(_.compact(_.invoke(that.piRecords, 'get', 'ActualStartDate')));
		var chartEndDate = that.selectedMilestoneObj.get('TargetDate');
		
		/*var chartStartDate = _.isEmpty(_.compact(_.invoke(that.selectedMilestoneObj, 'get', 'ActiveStartDate'))) ? _.min(_.compact(_.invoke(that.piRecords, 'get', 'ActualStartDate'))) : _.first(_.compact(_.invoke(that.selectedMilestoneObj, 'get', 'ActiveStartDate'))); 
		var chartEndDate = _.first(_.compact(_.invoke(that.selectedMilestoneObj, 'get', 'TargetDate')));*/
		
		console.log('Chart Start Date: ', chartStartDate);
		console.log('Chart End Date: ', chartEndDate);
		
		var chart = {
			xtype : 'rallychart',
			flex : 1,
			storeType : 'Rally.data.lookback.SnapshotStore',
			storeConfig : that._getStoreConfig(),
			calculatorType : 'Rally.example.BurnCalculator',
			calculatorConfig : {
				completedScheduleStateNames : [ 'Accepted', 'Released' ],
				stateFieldValues : that.scheduleStateValues,
				startDate : chartStartDate,
				endDate : chartEndDate,
				enableProjects : true
			},
			chartColors: ["#A16E3A", "#1B7F25", "#B1B1B7", "#2E2EAC"],
			chartConfig : that._getChartConfig(),
			listeners : {
				afterrender : function(obj, eOpts ) {					
					Ext.getBody().unmask();
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
	 * Generate a valid Highcharts configuration object to specify the chart
	 */

	_getChartConfig : function() {
		return {
			chart : {
				defaultSeriesType : 'area',
				zoomType : 'xy'
			},
			title : {
				text : 'Milestone Burnup'
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