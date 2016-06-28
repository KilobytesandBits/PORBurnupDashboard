Ext
		.define(
				'PADDynamicDoc',
				{
					chartDiag : null,
					selectedMilestone : null,
					selectedMilestoneObj : null,
					selectedFeatures : null,
					selectedFeaturesObj : null,
					allFeatures : null,

					_createMultiFeatureSelector : function(milestoneRec, chartDiag) {
						this.chartDiag = chartDiag;
						var chartDiagId = chartDiag.getId();

						Ext.getCmp(chartDiagId).mask('Fetching Feature list for ' + milestoneRec.get('FormattedID') + '...');

						this.selectedMilestone = milestoneRec.get('ObjectID');
						this.selectedMilestoneObj = milestoneRec;

						this._createFeaturesStore();

					},

					_createFeaturesStore : function() {
						var selectedMilestone = this.selectedMilestone;

						Ext.create('Rally.data.wsapi.Store', {
							model : 'PortfolioItem/Feature',
							autoLoad : true,
							compact : false,
							context : {
								workspace : Rally.environment.getContext().getWorkspace()._ref,
								project : null,
								projectScopeUp : false,
								projectScopeDown : true
							},
							filters : [ {
								property : 'Milestones.ObjectID',
								operator : '=',
								value : selectedMilestone
							} ],
							fetch : [ 'ObjectID', 'FormattedID', 'Name' ],
							limit : Infinity,
							listeners : {
								load : function(store, data, success) {
									if (data.length > 0) {
										this._createFeatureDataStore(data);
									} else {
										Rally.ui.notify.Notifier.showError({
											message : 'No Feature is associated with the selected Milestone.'
										});
									}

									Ext.getCmp(this.chartDiag.getId()).unmask();
								},
								scope : this
							},
							sorters : [ {
								property : 'Name',
								direction : 'ASC'
							} ]
						});
					},

					/**
					 * Convert the WASPI Data Store for Feature to
					 * Ext.data.Store
					 */
					_createFeatureDataStore : function(myData) {

						var that = this;
						var featureArr = [];

						Ext.each(myData, function(data, index) {
							var feature = {};
							feature.ObjectID = data.data.ObjectID;
							feature.FormattedID = data.data.FormattedID;
							feature.Name = data.data.Name;
							feature.DisplayName = data.data.FormattedID + ' - ' + data.data.Name;
							feature.ChildStories = [];

							featureArr.push(feature);
						});

						this.allFeatures = featureArr;

						var featureDataStore = Ext.create('Ext.data.Store', {
							fields : [ 'ObjectID', 'FormattedID', 'Name', 'DisplayName', 'ChildStories' ],
							data : featureArr
						});
						this._generateMultiFeatureSelector(featureDataStore);
					},

					_generateMultiFeatureSelector : function(features) {
						var that = this;

						var featurePicker = Ext.create('Ext.form.ComboBox', {
							fieldLabel : 'Select Feature(s) ',
							store : features,
							displayField : 'DisplayName',
							queryMode : 'local',
							valueField : 'ObjectID',
							emptyText : 'click to select...',
							multiSelect : true,
							border : 1,
							style : {
								borderColor : '#000000',
								borderStyle : 'solid',
								borderWidth : '1px',
								height : '40px'
							},
							width : 700,
							padding : '10 5 5 10',
							margin : '10 5 5 10',
							shadow : 'frame',
							labelAlign : 'right',
							labelStyle : {
								margin : '10 5 5 10'
							},
							listeners : {
								select : function(combo, records, eOpts) {
									this.selectedFeatures = combo.getValue();
									this.selectedFeaturesObj = records;
								},
								scope : this
							}
						});

						this.chartDiag.add(featurePicker);

						var generatePADButton = {
							name : 'generatePADButton',
							id : 'generatePADButton',
							xtype : 'rallybutton',
							text : 'Generate PAD',
							margin : '10 10 10 10',
							padding : '10 10 10 10',
							width : 150,
							handler : function() {
								Ext.getCmp(that.chartDiag.getId()).mask('Generating PAD Document based on selected features...');
								this._getUserStories();
							},
							scope : this
						};

						this.chartDiag.add(generatePADButton);
					},

					_getUserStories : function() {

						var that = this;

						if (this.selectedFeatures === null || this.selectedFeatures.length <= 0) {
							Rally.ui.notify.Notifier.showError({
								message : 'No Feature is selected to generate PAD document. Please select at leat one feature.'
							});

							Ext.getCmp(this.chartDiag.getId()).unmask();

						} else {
							Ext.create('Rally.data.wsapi.Store', {
								model : 'userstory',
								autoLoad : true,
								compact : false,
								context : {
									workspace : Rally.environment.getContext().getWorkspace()._ref,
									project : null,
									projectScopeUp : false,
									projectScopeDown : true
								},
								filters : that._getUserStoryFilter(),
								fetch : [ 'ObjectID', 'FormattedID', 'Name', 'Description', 'Feature' ],
								limit : Infinity,
								listeners : {
									load : function(store, data, success) {
										if (data.length > 0) {
											this._createFeatureUserStoryRelation(data);
										} else {
											Rally.ui.notify.Notifier.showError({
												message : 'No User Stories is associated with the selected Features.'
											});
										}
									},
									scope : this
								},
								sorters : [ {
									property : 'Feature.ObjectID',
									direction : 'ASC'
								} ]
							});
						}
					},

					_getUserStoryFilter : function() {
						var filter = null;

						Ext.Array.each(this.selectedFeatures, function(selectedFeature) {
							if (filter === null) {
								filter = Ext.create('Rally.data.wsapi.Filter', {
									property : 'Feature.ObjectID',
									operator : '=',
									value : selectedFeature
								});
							} else {
								filter = filter.or(Ext.create('Rally.data.wsapi.Filter', {
									property : 'Feature.ObjectID',
									operator : '=',
									value : selectedFeature
								}));
							}
						});

						return filter;
					},

					_createFeatureUserStoryRelation : function(userStories) {
						var generatedPADObj = {};
						Ext.Array.each(this.selectedFeaturesObj, function(selectedFeatureObj) {
							Ext.Array.each(userStories, function(userStory) {
								if (userStory.data.Feature.ObjectID === selectedFeatureObj.data.ObjectID) {
									selectedFeatureObj.data.ChildStories.push(userStory.data);
								}
							});
						});

						generatedPADObj.selectedFeaturesObj = this.selectedFeaturesObj;

						generatedPADObj.CurrentDate = Ext.Date.format(new Date(), 'd-M-Y');
						generatedPADObj.UserName = Rally.environment.getContext().getUser().DisplayName;

						generatedPADObj.name = this.selectedMilestoneObj.data.Name;

						this._generatePAD(generatedPADObj);
					},

					_generatePAD : function(generatedPADObj) {

						var tpl = new Ext.XTemplate(

								'<div id="page-content" style="font-size: medium;font-family: arial, Verdana, sans-serif"><h1 style="text-align : center;">Product Architecture Document (PAD)</h1>',

								'<br/><br/><br/>',

								'<table><tr><td><span style="text-decoration: underline; font-weight: bold; padding-right: 10px;">Product Name:</span><td> <td style="color: blue;"> &lt;Enter product name.&gt; </td></tr>',
								'<tr><td><span style="text-decoration: none; font-weight: bold; padding-right: 10px;">&nbsp;</span><td> <td>&nbsp;</td></tr>',
								'<tr><td><span style="text-decoration: underline; font-weight: bold; padding-right: 10px;">Date:</span><td> <td>{CurrentDate}</td></tr>',
								'<tr><td><span style="text-decoration: underline; font-weight: bold; padding-right: 10px;">Contact:</span><td> <td>{UserName}</td></tr>',
								'<tr><td><span style="text-decoration: underline; font-weight: bold; padding-right: 10px;">Department:</span><td> <td style="color: blue;">&lt;Enter department name.&gt;</td></tr>',
								'<tr><td><span style="text-decoration: underline; font-weight: bold; padding-right: 10px;">Location:</span><td> <td style="color: blue;">&lt;Enter office location of primary document owner.&gt;</td></tr>',
								'</table>',

								'<div style="font-size: small; font-family: arial, Verdana, sans-serif">',
								'<p style="page-break-before: always;">&nbsp;</p>',
								'<p style="text-decoration: underline; font-weight: bold; padding-right: 10px;">Document Revision History:</p>',

								'<table style="border-collapse: collapse; border: 1px solid black; width: 590px;"><tr><th style="border: 1px solid black;">&nbsp;Date&nbsp;</th><th style="border: 1px solid black;">&nbsp;Revision&nbsp;</th><th style="border: 1px solid black;">&nbsp;Description&nbsp;</th><th style="border: 1px solid black;">&nbsp;Author&nbsp;</th></tr>',
								'<tr><td style="border: 1px solid black;">&nbsp;{CurrentDate}&nbsp;</td><td style="border: 1px solid black;">&nbsp;0.1&nbsp;</td><td style="border: 1px solid black;">&nbsp;Initial PAD&nbsp;</td><td style="border: 1px solid black;">&nbsp;{UserName}&nbsp;</td></tr>',
								'<tr style="color: blue;"><td style="border: 1px solid black;">&nbsp;&lt;Enter date&gt;&nbsp;</td><td style="border: 1px solid black;">&nbsp;&lt;#.&gt;&nbsp;</td><td style="border: 1px solid black;">&nbsp;&lt;Descibe Changes.&gt;&nbsp;</td><td style="border: 1px solid black;">&nbsp;&lt;Enter Name.&gt;&nbsp;</td></tr>',
								'<tr><td style="border: 1px solid black;">&nbsp;</td><td style="border: 1px solid black;">&nbsp;</td><td style="border: 1px solid black;">&nbsp;</td><td style="border: 1px solid black;">&nbsp;</td></tr>',
								'<tr><td style="border: 1px solid black;">&nbsp;</td><td style="border: 1px solid black;">&nbsp;</td><td style="border: 1px solid black;">&nbsp;</td><td style="border: 1px solid black;">&nbsp;</td></tr>',
								'</table>',

								'<p style="page-break-before: always;">&nbsp;</p>',

								'<ol>',
								'<li style="padding-bottom: 15px;"><h2 style="font-size: 18px; background-color: gray;color: white;border-top: 2px solid black;border-bottom: 2px solid black;"> Overview <br/> </h2>',
								'<ol>',
								'<li>',
								'<h3>Document Objective</h3>',
								'<p>The Product Architecture Document (PAD) provides a detailed definition of one or more high-level features specified in a PRD.  The definition includes both behavioral and architectural specifications. </p>',
								'</li>',
								'<li>',
								'<h3>General description</h3>',
								'<p style="color: blue;">&lt;Provide orientation to the product/release being specified. This is an overview of the product/release to orient the reader and provide a summary that interested project stakeholders can read to understand the product/release requirements at a high level.&gt; </p>',
								'<p>{Description}</p>',
								'</li>',
								'<li>',
								'<h3>Related Documents</h3>',
								'<p style="color: blue;">&lt;Links or references to the related documents like PRD or other PADs.&gt; </p>',
								'<p>{Description}</p>',
								'</li>',
								'</ol>',
								'</li>',
								'<li style="padding-bottom: 15px;"><h2 style="font-size: 18px; background-color: gray;color: white;border-top: 2px solid black;border-bottom: 2px solid black;"> Additional Requirements <br/> </h2>',
								'<p style="color: blue;">&lt;Requirements should be precise, measurable, and verifiable. Specify non-functional requirements, and cross-cutting requirements that can be described more clearly with simple statements, such as "Full functionality is available through both IE and Firefox".&gt; </p>',
								'<ol>',
								'<li>',
								'Requirement 1',
								'</li>',
								'<li>',
								'Requirement 2',
								'</li>',
								'</ol>',
								'</li>',
								'<li style="padding-bottom: 15px;"><h2 style="font-size: 18px; background-color: gray;color: white;border-top: 2px solid black;border-bottom: 2px solid black;"> Functional Description <br/> </h2>',
								'<p style="color: blue;">&lt;Describe in detail all aspects of this project which will be user visible. Include UI wireframe mock-ups if the project will include new or modified UI components.  For screens with complex behaviors or multiple views, include a mock-up showing each state.  These screenshots should have corresponding text that describes any special interactive behaviors that are not obvious from looking at a static picture.&gt; </p>',
								'<ol>',
								'<tpl for="selectedFeaturesObj">',
								'<li><h3>{data.FormattedID} - {data.Name}<br/></h3>',
								'<ol>',
								'<tpl for="data.ChildStories">',
								'<li><h4>{FormattedID} - {Name}<br/></h4><p>{Description}<br/></p> </li>',
								'</tpl>',
								'</ol>',
								'</li>',
								'</tpl>',
								'</ol>',
								'</li>',
								'<li style="padding-bottom: 15px;"><h2 style="font-size: 18px; background-color: gray;color: white;border-top: 2px solid black;border-bottom: 2px solid black;"> Non Goals <br/> </h2>',
								'<p style="color: blue;">&lt;List the non-goals of this release. The non-goals are those features that are explicitly NOT going to be implemented for this release.&gt; </p>',
								'</li>',
								'<li style="padding-bottom: 15px;"><h2 style="font-size: 18px; background-color: gray;color: white;border-top: 2px solid black;border-bottom: 2px solid black;"> Architecture <br/> </h2>',
								'<p style="color: blue;">&lt;Architectural description detailed enough to support estimates.  This section may contain high-level description, class diagrams, interaction diagram, and/or code snips.&gt; </p>',
								'</li>',
								'<li style="padding-bottom: 15px;"><h2 style="font-size: 18px; background-color: gray;color: white;border-top: 2px solid black;border-bottom: 2px solid black;"> Estimates <br/> </h2>',
								'<p>',
								'<table style="border-collapse: collapse; border: 1px solid black; width: 590px;"><tr><th style="border: 1px solid black;">&nbsp;Task&nbsp;</th><th style="border: 1px solid black;">&nbsp;Estimate (person days)&nbsp;</th></tr>',
								'<tpl for="selectedFeaturesObj">', '<tpl for="data.ChildStories">',
								'<tr><td style="border: 1px solid black;">{FormattedID} - {Name}</td><td style="border: 1px solid black;">&nbsp;</td></tr>', '</tpl>', '</tpl>',
								'<tr><td style="border: 1px solid black;">&nbsp;</td><td style="border: 1px solid black;">&nbsp;</td></tr>',
								'<tr><td style="border: 1px solid black;">&nbsp;</td><td style="border: 1px solid black;">&nbsp;</td></tr>', '</table>', '</p>', '</li>', '</ol>',

								'</div> </div>');

						if (this.chartDiag.down('#doc-container') !== null) {
							this.chartDiag.down('#doc-container').destroy();
						}

						this.chartDiag.add({
							xtype : 'container',
							id : 'doc-container',
							html : tpl.apply(generatedPADObj)
						});

						var exportToDocBtn = Ext.create('Ext.Button', {
							text : 'Save as .doc',
							scale : 'large',
							cls : 'custExprtBtnCls',
							handler : function() {
								$("#page-content").wordExport("PAD - " + generatedPADObj.name);
							}
						});

						this.chartDiag.down('#doc-container').add(exportToDocBtn);

						Ext.getCmp(this.chartDiag.getId()).unmask();
					}
				});