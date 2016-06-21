Ext
		.define(
				'PRDDynamicDoc',
				{
					selectedMilestone : null,
					selectedMilestoneObj : null,
					milestoneData : null,
					artifactsData : null,
					chartDiag : null,

					/**
					 * Get the required data to generate doc
					 */
					_getReqData : function(milestoneRec, chartDiag) {

						this.chartDiag = chartDiag;
						var chartDiagId = chartDiag.getId();

						Ext.getCmp(chartDiagId).mask('Fetching Milestone data for ' + milestoneRec.get('FormattedID') + '...');

						this.selectedMilestone = milestoneRec.get('ObjectID');
						this.selectedMilestoneObj = milestoneRec;

						Deft.Promise.all([ this._getMileStoneData(), this._loadArtifacts() ]).then({
							success : function() {
								this._generateDoc();
							},
							scope : this
						});
					},

					/**
					 * Get the milestone data to create the doc
					 */
					_getMileStoneData : function() {

						var that = this;

						filter = Ext.create('Rally.data.wsapi.Filter', {
							property : 'ObjectID',
							operator : '=',
							value : that.selectedMilestone
						});

						return Ext.create('Rally.data.wsapi.Store', {
							model : 'Milestone',
							autoLoad : true,
							compact : false,
							context : {
								workspace : Rally.environment.getContext().getWorkspace()._ref,
								project : null,
								projectScopeUp : false,
								projectScopeDown : true
							},
							filters : filter,
							fetch : [ 'FormattedID', 'Name', 'Notes' ],
							limit : Infinity
						}).load().then({
							success : function(milestone) {
								this.milestoneData = milestone;
							},
							scope : this
						});
					},

					/**
					 * Get the milestone data to create the doc
					 */
					_loadArtifacts : function() {

						var that = this;

						return Ext.create('Rally.data.wsapi.artifact.Store', {
							models : [ 'portfolioitem/feature', 'defect', 'userstory' ],
							context : {
								workspace : Rally.environment.getContext().getWorkspace()._Ref,
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
								this.artifactsData = artifacts;
							},
							scope : this
						});
					},

					/**
					 * Generate doc using milestone data
					 */
					_generateDoc : function() {

						var data = this._generateData();

						var tpl = new Ext.XTemplate(

								'<div id="page-content" style="font-size: medium;font-family: arial, Verdana, sans-serif"><h1 style="text-align : center;">Product Requirements Document (PRD)</h1>',

								'<br/><br/><br/>',

								'<table><tr><td><span style="text-decoration: underline; font-weight: bold; padding-right: 10px;">Product Name:</span><td> <td>{FormattedID} - {Name}</td></tr>',
								'<tr><td colspan=2>&nbsp;</td></tr>',
								'<tr><td><span style="text-decoration: underline; font-weight: bold; padding-right: 10px;">Date:</span><td> <td>{CurrentDate}</td></tr>',
								'<tr><td><span style="text-decoration: underline; font-weight: bold; padding-right: 10px;">Contact:</span><td> <td>{userName}</td></tr>',
								'</table>',

								'<div style="font-size: small; font-family: arial, Verdana, sans-serif">',
								'<p style="page-break-before: always;">&nbsp;</p>',
								'<p style="text-decoration: underline; font-weight: bold; padding-right: 10px;">Document Revision History:</p>',

								'<table style="border-collapse: collapse; border: 1px solid black; width: 590px;"><tr><th style="border: 1px solid black;">&nbsp;Date&nbsp;</th><th style="border: 1px solid black;">&nbsp;Revision&nbsp;</th><th style="border: 1px solid black;">&nbsp;Description&nbsp;</th><th style="border: 1px solid black;">&nbsp;Author&nbsp;</th></tr>',
								'<tr><td style="border: 1px solid black;">&nbsp;{CurrentDate}&nbsp;</td><td style="border: 1px solid black;">&nbsp;0.1&nbsp;</td><td style="border: 1px solid black;">&nbsp;Initial PRD&nbsp;</td><td style="border: 1px solid black;">&nbsp;{userName}&nbsp;</td></tr>',
								'<tr><td style="border: 1px solid black;">&nbsp;&lt;Enter date&gt;&nbsp;</td><td style="border: 1px solid black;">&nbsp;&lt;#.&gt;&nbsp;</td><td style="border: 1px solid black;">&nbsp;&lt;Descibe Changes.&gt;&nbsp;</td><td style="border: 1px solid black;">&nbsp;&lt;Enter Name.&gt;&nbsp;</td></tr>',
								'<tr><td style="border: 1px solid black;">&nbsp;</td><td style="border: 1px solid black;">&nbsp;</td><td style="border: 1px solid black;">&nbsp;</td><td style="border: 1px solid black;">&nbsp;</td></tr>',
								'<tr><td style="border: 1px solid black;">&nbsp;</td><td style="border: 1px solid black;">&nbsp;</td><td style="border: 1px solid black;">&nbsp;</td><td style="border: 1px solid black;">&nbsp;</td></tr>',
								'</table>',

								'<p style="page-break-before: always;">&nbsp;</p>',

								'<ol>',
								'<li style="padding-bottom: 15px;"><h2 style="font-size: 18px; background-color: gray;color: white;border-top: 2px solid black;border-bottom: 2px solid black;"> Overview <br/> </h2>',
								'<ol>',
								'<li>',
								'<h3>Document Objective</h3>',
								'<p>The Product Requirements Document (PRD) provides a complete requirements definition of a product, based on the market requirements.  The PRD describes the features of a product without regard to implementation. </p>',
								'</li>',
								'<li>',
								'<h3>General description</h3>',
								'<p>{Notes}</p>',
								'</li>',
								'</ol>',
								'</li>',
								'<li style="padding-bottom: 15px;"><h2 style="font-size: 18px; background-color: gray;color: white;border-top: 2px solid black;border-bottom: 2px solid black;"> Product Features <br/> </h2>',

								'<ol>', '<tpl for="mustHaveClassOfServices">', '<li><h3>{c_ClassofService} - {PortfolioItemTypeName} - {FormattedID} - {Name}</h3><p>{Description}</p> <br/></li>',
								'</tpl>',

								'<tpl for="shouldHaveClassOfServices">', '<li><h3>{c_ClassofService} - {PortfolioItemTypeName} - {FormattedID} - {Name}</h3><p>{Description}</p> <br/></li>',
								'</tpl> ',

								'<tpl for="niceToHaveClassOfServices">', '<li><h3>{c_ClassofService} - {PortfolioItemTypeName} - {FormattedID} - {Name}</h3><p>{Description}</p> <br/></li>',
								'</tpl> ',

								'</ol>', '</li>', '</ol>',

								'</div> </div>');

						this.chartDiag.removeAll(true);

						if (this.chartDiag.down('#doc-container') !== null) {
							this.chartDiag.down('#doc-container').destroy();
						}

						this.chartDiag.add({
							xtype : 'container',
							id : 'doc-container',
							html : tpl.apply(data)
						});

						var exportToDocBtn = Ext.create('Ext.Button', {
							text : 'Save as .doc',
							scale : 'large',
							cls : 'custExprtBtnCls',
							handler : function() {
								$("#page-content").wordExport("PRD - " + data.Name);
							}
						});

						this.chartDiag.down('#doc-container').add(exportToDocBtn);

						Ext.getCmp(this.chartDiag.getId()).unmask();

					},

					/**
					 * Generate data to populate in template
					 */
					_generateData : function() {
						var data = {};

						data.FormattedID = this.milestoneData[0].data.FormattedID;
						data.Name = this.milestoneData[0].data.Name;
						data.CurrentDate = Ext.Date.format(new Date(), 'd-M-Y');
						data.userName = Rally.environment.getContext().getUser().DisplayName;
						data.Notes = this.milestoneData[0].data.Notes.split("<li>").join('').split("</li>").join('<br>');

						var mustHaveClassOfServices = [];
						var shouldHaveClassOfServices = [];
						var niceToHaveClassOfServices = [];

						Ext.each(this.artifactsData, function(data, index) {
							var artifact = {};
							artifact.PortfolioItemTypeName = data.data.PortfolioItemTypeName;
							artifact.FormattedID = data.data.FormattedID;
							artifact.Name = data.data.Name;
							artifact.c_ClassofService = data.data.c_ClassofService;
							artifact.Description = data.data.Description;

							if (artifact.c_ClassofService === "Must Have") {
								mustHaveClassOfServices.push(artifact);
							} else if (artifact.c_ClassofService === "Should Have") {
								shouldHaveClassOfServices.push(artifact);
							} else {
								niceToHaveClassOfServices.push(artifact);
							}
						});

						data.mustHaveClassOfServices = mustHaveClassOfServices;
						data.shouldHaveClassOfServices = shouldHaveClassOfServices;
						data.niceToHaveClassOfServices = niceToHaveClassOfServices;

						console.log(data);

						return data;
					}

				});