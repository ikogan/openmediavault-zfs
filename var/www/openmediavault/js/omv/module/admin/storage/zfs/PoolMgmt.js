// require("js/omv/workspace/window/Form.js")
// require("js/omv/data/Store.js")
// require("js/omv/data/Model.js")
// require("js/omv/data/proxy/Rpc.js")
// require("js/omv/data/reader/RpcArray.js")
// require("js/omv/form/field/CheckboxGrid.js")
Ext.define("OMV.module.admin.storage.zfs.ImportPool", {
	extend: "OMV.workspace.window.Form",
	requires: [
		"OMV.data.Store",
		"OMV.data.Model",
		"OMV.data.proxy.Rpc",
	],

	rpcService: "ZFS",
	rpcSetMethod: "importPool",
	title: _("Import ZFS Pool(s)"),
	autoLoadData: false,
	hideResetButton: true,
	width: 550,
	height: 150,

	getFormItems: function() {
		var me = this;
		return [{
			xtype: "textfield",
			name: "poolname",
			fieldLabel: _("Pool Name"),
			allowBlank: true
		},{
			xtype: "checkbox",
			name: "all",
			fieldLabel: _("Import all"),
			checked: false,
			plugins: [{
				ptype: "fieldinfo",
				text: _("Import all missing pools. Overrides pool specification above.")
			}]
		}];
	}
});

Ext.define("OMV.module.admin.storage.zfs.AddPool", {
	extend: "OMV.workspace.window.Form",
	requires: [
		"OMV.data.Store",
		"OMV.data.Model",
		"OMV.data.proxy.Rpc",
		"OMV.form.field.CheckboxGrid"
	],

	rpcService: "ZFS",
	rpcSetMethod: "addPool",
	title: _("Create ZFS Pool"),
	autoLoadData: false,
	hideResetButton: true,
	width: 550,
	height: 460,

	getFormItems: function() {
		var me = this;
		return [{
			xtype: "textfield",
			name: "name",
			fieldLabel: _("Name"),
			allowBlank: false
		},{
			xtype: "combo",
			name: "pooltype",
			fieldLabel: _("Pool type"),
			queryMode: "local",
			store: Ext.create("Ext.data.ArrayStore", {
				fields: [ "value", "text" ],
				data: [
					[ "basic", _("Basic") ],
					[ "mirror", _("Mirror") ],
					[ "raidz1", _("RAID-Z1") ],
					[ "raidz2", _("RAID-Z2") ],
					[ "raidz3", _("RAID-Z3") ]
				]
			}),
			displayField: "text",
			valueField: "value",
			allowBlank: false,
			editable: false,
			triggerAction: "all",
			value: "raidz1",
			listeners: {
				scope: me,
				change: function(combo, value) {
					var devicesField = this.findField("devices");
					switch(value) {
						case "basic":
							devicesField.minSelections = 1;
						break;
						case "mirror":
							devicesField.minSelections = 2;
						break;
						case "raidz1":
							devicesField.minSelections = 3;
						break;
						case "raidz2":
							devicesField.minSelections = 4;
							break;
						case "raidz3":
							devicesField.minSelections = 5;
						break;
						default:
							devicesField.minSelections = 2;
						break;
					}
					devicesField.validate();
				}
			}
		},{
			xtype: "checkboxgridfield",
			name: "devices",
			fieldLabel: _("Devices"),
			valueField: "devicefile",
			minSelections: 3, // Min. number of devices for RAIDZ-1
			useStringValue: true,
			height: 130,
			store: Ext.create("OMV.data.Store", {
				autoLoad: true,
				model: OMV.data.Model.createImplicit({
					idProperty: "devicefile",
					fields: [
						{ name: "devicefile", type: "string" },
						{ name: "size", type: "string" },
						{ name: "vendor", type: "string" },
						{ name: "serialnumber", type: "string" }
					]
				}),
				proxy: {
					type: "rpc",
					appendSortParams: false,
					rpcData: {
						service: "ZFS",
						method: "getCandidates"
					}
				},
				sorters: [{
					direction: "ASC",
					property: "devicefile"
				}]
			}),
			gridConfig: {
				stateful: true,
				stateId: "1866b5d0-327e-11e4-8c21-0800200c9a66",
				columns: [{
					text: _("Device"),
					sortable: true,
					dataIndex: "devicefile",
					stateId: "devicefile",
					flex: 1
				},{
					xtype: "binaryunitcolumn",
					text: _("Capacity"),
					sortable: true,
					dataIndex: "size",
					stateId: "size",
					width: 50,
					flex: 1
				},{
					text: _("Vendor"),
					sortable: true,
					dataIndex: "vendor",
					stateId: "vendor",
					flex: 1
				},{
					text: _("Serial Number"),
					sortable: true,
					dataIndex: "serialnumber",
					stateId: "serialnumber",
					flex: 1
				}]
			}
		},{
			xtype: "textfield",
			name: "mountpoint",
			fieldLabel: _("Mountpoint"),
			plugins: [{
				ptype: "fieldinfo",
				text: _("Optional mountpoint for the pool. Default is to use pool name.")
			}]
		},{
			xtype: "combo",
			name: "devalias",
			fieldLabel: _("Device alias"),
			queryMode: "local",
			store: Ext.create("Ext.data.ArrayStore", {
				fields: [ "value", "text" ],
				data: [
					[ "path", _("By Path") ],
					[ "id", _("By Id") ],
					[ "dev", _("None") ]
				]
			}),
			displayField: "text",
			valueField: "value",
			allowBlank: false,
			editable: false,
			value: "path",
			plugins: [{
				ptype: "fieldinfo",
				text: _("Specifies which device alias should be used. Don't change unless needed.")
			}]
		},{
			xtype: "checkbox",
			name: "force",
			fieldLabel: _("Force creation"),
			checked: false,
			plugins: [{
				ptype: "fieldinfo",
				text: _("Forces the creation of the pool even if errors are reported. Use with extreme caution!")
			}]
		},{
			xtype: "checkbox",
			name: "ashift",
			fieldLabel: _("Set ashift"),
			plugins: [{
				ptype: "fieldinfo",
				text: _("Specify ashift value. Only use if you are sure you need it.")
			}],
			listeners: {
				scope: me,
				change: function(combo, value) {
					var ashifttxt = this.findField("ashiftval");
					if (value === true) {
						ashifttxt.show();
						ashifttxt.allowBlank = false;
					} else {
						ashifttxt.hide();
						ashifttxt.allowBlank = true;
					}
				}
			}
		},{
			xtype: "textfield",
			name: "ashiftval",
			fieldLabel: _("Ashift value"),
			plugins: [{
				ptype: "fieldinfo",
				text: _("Ashift value to use.")
			}],
			hidden: true,
			allowBlank: true
		}];
	},

	doSubmit: function() {
		var me = this;
		OMV.MessageBox.show({
			title: _("Confirmation"),
			msg: _("Do you really want to create the ZFS pool?<br/><br/>" +
				   "The process will take some time and no change will be displayed until it is completed.<br/>" +
				   "Please reload the page to update any changes."),
			buttons: Ext.Msg.YESNO,
			fn: function(answer) {
				if(answer === "no")
					return;
				me.superclass.doSubmit.call(me);
			},
			scope: me,
			icon: Ext.Msg.QUESTION
		});
	}
});

Ext.define("OMV.module.admin.storage.zfs.ExpandPool", {
	extend: "OMV.workspace.window.Form",
	uses: [
		"OMV.data.Store",
		"OMV.data.Model",
		"OMV.data.proxy.Rpc",
		"OMV.data.reader.RpcArray"
	],

	rpcService: "ZFS",
	rpcSetMethod: "expandPool",
	width: 550,
	height: 350,
	autoLoadData: true,

	getFormItems: function() {
		var me = this;
		return [{
			xtype: "textfield",
			name: "name",
			fieldLabel: _("Name"),
			allowBlank: false,
			readOnly: true,
			value: me.name
		},{
			xtype: "combo",
			name: "vdevtype",
			fieldLabel: _("Vdev type"),
			queryMode: "local",
			store: Ext.create("Ext.data.ArrayStore", {
				fields: [ "value", "text" ],
				data: [
					[ "basic", _("Basic") ],
					[ "mirror", _("Mirror") ],
					[ "raidz1", _("RAID-Z1") ],
					[ "raidz2", _("RAID-Z2") ],
					[ "raidz3", _("RAID-Z3") ]
				]
			}),
			displayField: "text",
			valueField: "value",
			allowBlank: false,
			editable: false,
			triggerAction: "all",
			value: "raidz1",
			listeners: {
				scope: me,
				change: function(combo, value) {
					var devicesField = this.findField("devices");
					switch(value) {
						case "basic":
							devicesField.minSelections = 1;
						break;
						case "mirror":
							devicesField.minSelections = 2;
						break;
						case "raidz1":
							devicesField.minSelections = 3;
						break;
						case "raidz2":
							devicesField.minSelections = 4;
							break;
						case "raidz3":
							devicesField.minSelections = 5;
						break;
						default:
							devicesField.minSelections = 2;
						break;
					}
					devicesField.validate();
				}
			}
		},{
			xtype: "checkboxgridfield",
			name: "devices",
			fieldLabel: _("Devices"),
			valueField: "devicefile",
			minSelections: 3, // Min. number of devices for RAIDZ-1
			useStringValue: true,
			height: 130,
			store: Ext.create("OMV.data.Store", {
				autoLoad: true,
				model: OMV.data.Model.createImplicit({
					idProperty: "devicefile",
					fields: [
						{ name: "devicefile", type: "string" },
						{ name: "size", type: "string" },
						{ name: "vendor", type: "string" },
						{ name: "serialnumber", type: "string" }
					]
				}),
				proxy: {
					type: "rpc",
					appendSortParams: false,
					rpcData: {
						service: "ZFS",
						method: "getCandidates"
					}
				},
				sorters: [{
					direction: "ASC",
					property: "devicefile"
				}]
			}),
			gridConfig: {
				stateful: true,
				stateId: "05c60750-5074-11e4-916c-0800200c9a66",
				columns: [{
					text: _("Device"),
					sortable: true,
					dataIndex: "devicefile",
					stateId: "devicefile",
					flex: 1
				},{
					xtype: "binaryunitcolumn",
					text: _("Capacity"),
					sortable: true,
					dataIndex: "size",
					stateId: "size",
					width: 50,
					flex: 1
				},{
					text: _("Vendor"),
					sortable: true,
					dataIndex: "vendor",
					stateId: "vendor",
					flex: 1
				},{
					text: _("Serial Number"),
					sortable: true,
					dataIndex: "serialnumber",
					stateId: "serialnumber",
					flex: 1
				}]
			}
		},{
			xtype: "combo",
			name: "devalias",
			fieldLabel: _("Device alias"),
			queryMode: "local",
			store: Ext.create("Ext.data.ArrayStore", {
				fields: [ "value", "text" ],
				data: [
					[ "path", _("By Path") ],
					[ "id", _("By Id") ],
					[ "dev", _("None") ]
				]
			}),
			displayField: "text",
			valueField: "value",
			allowBlank: false,
			editable: false,
			value: "path",
			plugins: [{
				ptype: "fieldinfo",
				text: _("Specifies which device alias should be used. Don't change unless needed.")
			}]
		},{
			xtype: "checkbox",
			name: "force",
			fieldLabel: _("Force creation"),
			checked: false,
			plugins: [{
				ptype: "fieldinfo",
				text: _("Forces the creation of the Vdev even if errors are reported. Use with extreme caution!")
			}]
		}];
	},

	doSubmit: function() {
		var me = this;
		OMV.MessageBox.show({
			title: _("Confirmation"),
			msg: _("Do you really want to expand the ZFS pool?<br/><br/>" +
				   "The process will take some time and no change will be displayed until it is completed.<br/>" +
				   "Please reload the page to update any changes."),
			buttons: Ext.Msg.YESNO,
			fn: function(answer) {
				if(answer === "no")
					return;
				me.superclass.doSubmit.call(me);
			},
			scope: me,
			icon: Ext.Msg.QUESTION
		});
	}
});

