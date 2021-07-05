sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/export/Spreadsheet",
	"sap/m/MessageToast",
	"com/minda/PlanVactual/model/formatter"
], function (Controller, JSONModel, Filter, FilterOperator, Spreadsheet, MessageToast, formatter) {
	"use strict";

	return Controller.extend("com.minda.PlanVactual.controller.Detail", {
		formatter: formatter,
		onInit: function () {
			this.oRouter = this.getOwnerComponent().getRouter();
			this.oRouter.getRoute("master").attachPatternMatched(this._onProductMatched, this);
			this.oRouter.getRoute("detail").attachPatternMatched(this._onProductMatched, this);

		},
		// handleFullScreen: function () {
		// 	this.getView().getModel("detailViewModel").setProperty("/fullScreenButtonVisible", false);
		// 	this.getView().getModel("detailViewModel").setProperty("/exitFSButtonVisible", true);
		// 	this.getOwnerComponent().getModel("layout").setProperty("/layout", "MidColumnFullScreen");
		// },
		// exitFullScreen: function () {
		// 	this.getView().getModel("detailViewModel").setProperty("/exitFSButtonVisible", false);
		// 	this.getView().getModel("detailViewModel").setProperty("/fullScreenButtonVisible", true);
		// 	this.getOwnerComponent().getModel("layout").setProperty("/layout", "TwoColumnsMidExpanded");
		// },
		handleClose: function () {
			// this.getView().getModel("detailViewModel").setProperty("/exitFSButtonVisible", false);
			// this.getView().getModel("detailViewModel").setProperty("/fullScreenButtonVisible", true);
			// this.getOwnerComponent().getModel("layout").setProperty("/layout", "OneColumn");
			this.oRouter.navTo("master");
		},
		_onProductMatched: function (oEvent) {
			this._product = oEvent.getParameter("arguments").AgreementNo || this._product || "0";
			var date = new Date();
			var FirstDay = new Date(date.getFullYear(), date.getMonth(), "01");
			this.getView().setModel(new JSONModel({
				fullScreenButtonVisible: true,
				busy: true,
				exitFSButtonVisible: false,
				fromDate: FirstDay,
				toDate: date,
				Plant: "MIL - LIGHTING MANESAR(1031)",
				VendorCode: "0000200323",
				felxBoxVisible: true,
				singleOrderTabVisible: false,
				allOrderTabVisible: true
			}), "detailViewModel");
			if (this._product == "all") {
				this.getView().getModel("detailViewModel").setProperty("/singleOrderTabVisible", false);
				this.getView().getModel("detailViewModel").setProperty("/allOrderTabVisible", true);
				this.getView().getModel("detailViewModel").setProperty("/felxBoxVisible", false);
				this.getView().getModel("detailViewModel").setProperty("/mPBVisible", true);
				this.getView().getModel("detailViewModel").setProperty("/detailViewTitle", "All Orders");
				var filter = [];
				filter.push(new sap.ui.model.Filter("VendorId", sap.ui.model.FilterOperator.EQ, '0000200323'));
				filter.push(new sap.ui.model.Filter("Plant", sap.ui.model.FilterOperator.EQ, "1031"));
				filter.push(new sap.ui.model.Filter("ScheduleDate", sap.ui.model.FilterOperator.BT, this.getView().getModel("detailViewModel").getProperty(
					"/fromDate"), this.getView().getModel("detailViewModel").getProperty("/toDate")));
				this._getDeliveryScheduleData(filter);
			} else {
				this.getView().getModel("detailViewModel").setProperty("/mPBVisible", false);
				this.getView().getModel("detailViewModel").setProperty("/allOrderTabVisible", false);
				this.getView().getModel("detailViewModel").setProperty("/singleOrderTabVisible", true);
				this.getView().getModel("detailViewModel").setProperty("/felxBoxVisible", true);
				this._getDetailViewData();
			}

		},
		handleDateRangeChange: function (oEvent) {
			var Difference_In_Time = oEvent.getSource().getSecondDateValue().getTime() - oEvent.getSource().getDateValue().getTime();
			var Difference_In_Days = Difference_In_Time / (1000 * 3600 * 24);
			if (Difference_In_Days > 31) {
				return MessageToast.show("Can not select more than 31 days...");
			}
			this.getView().getModel("detailViewModel").setProperty("/busy", true);
			var filter = [];
			if (this._product == "all") {
				filter.push(new sap.ui.model.Filter("VendorId", sap.ui.model.FilterOperator.EQ, '0000200323'));
				filter.push(new sap.ui.model.Filter("Plant", sap.ui.model.FilterOperator.EQ, "1031"));
			} else {
				filter.push(new sap.ui.model.Filter("AgreementId", sap.ui.model.FilterOperator.EQ, this._product));
			}
			filter.push(new sap.ui.model.Filter("ScheduleDate", sap.ui.model.FilterOperator.BT, oEvent.getSource().getDateValue(), oEvent.getSource()
				.getSecondDateValue()));
			this._getDeliveryScheduleData(filter);
		},
		_getDeliveryScheduleData: function (filter) {
			this.getOwnerComponent().getModel().metadataLoaded().then(function () {
				this.getOwnerComponent().getModel("pvaService").read("/PlannedVsActualSet", {
					filters: filter,
					success: function (oData) {
						if (oData.results.length != 0) {
							if (oData.results[0].AgreementId == "") {
								this.getView().getModel("detailViewModel").setProperty("/items", []);
								this.getView().getModel("detailViewModel").setProperty("/tableTitle", "Orders (0)");
							} else {
								for (var i = 0; i < oData.results.length; i++) {
									oData.results[i].ASNQty = 'NaN';
								}
								this.getView().getModel("detailViewModel").setProperty("/items", oData.results);
								this.getView().getModel("detailViewModel").setProperty("/tableTitle", "Orders (" + oData.results.length + ")");
							}
						} else {
							this.getView().getModel("detailViewModel").setProperty("/items", []);
							this.getView().getModel("detailViewModel").setProperty("/tableTitle", "Orders (0)");
						}
						this.getView().getModel("detailViewModel").setProperty("/Plant", "MIL - LIGHTING MANESAR(1031)");
						this.getView().getModel("detailViewModel").setProperty("/busy", false);
					}.bind(this),
					error: function (oError) {

					}.bind(this)
				});

			}.bind(this));
		},
		_getDetailViewData: function () {
			this.getOwnerComponent().getModel().metadataLoaded().then(function () {
				this.getOwnerComponent().getModel().read("/SchAgrHeaderSet('" + this._product + "')", {
					urlParameters: {
						"$expand": 'items,items/ItemCond,conditions'
					},
					success: function (oData) {
						for (var key in oData) {
							this.getView().getModel("detailViewModel").setProperty("/" + key, oData[key]);
						}
						this.getView().getModel("detailViewModel").setProperty("/detailViewTitle", "Order Id: " + this._product);
						this.getView().getModel("detailViewModel").setProperty("/Plant", "MIL - LIGHTING MANESAR(1031)");
						var filter = [];
						filter.push(new sap.ui.model.Filter("AgreementId", sap.ui.model.FilterOperator.EQ, this._product));
						filter.push(new sap.ui.model.Filter("ScheduleDate", sap.ui.model.FilterOperator.BT, this.getView().getModel(
							"detailViewModel").getProperty(
							"/fromDate"), this.getView().getModel("detailViewModel").getProperty("/toDate")));
						filter.push(new sap.ui.model.Filter("PageNumber", sap.ui.model.FilterOperator.EQ, "1"));
						filter.push(new sap.ui.model.Filter("PageSize", sap.ui.model.FilterOperator.EQ, "20"));
						this._getDeliveryScheduleData(filter);
					}.bind(this),
					error: function (oError) {

					}.bind(this)
				});

			}.bind(this));
		},
		onMaterialCodeSearch: function (oEvent) {
			var oTableSearchState = [],
				sQuery = oEvent.getParameter("newValue");
			if (sQuery && sQuery.length > 0) {
				oTableSearchState = [new Filter("MaterialCode", FilterOperator.Contains, sQuery)];
			}
			this.getView().byId("table").getBinding("items").filter(oTableSearchState, "Application");
		},
		onMaterialNameSearch: function (oEvent) {
			var oTableSearchState = [],
				sQuery = oEvent.getParameter("newValue");
			if (sQuery && sQuery.length > 0) {
				oTableSearchState = [new Filter("MaterialName", FilterOperator.Contains, sQuery)];
			}
			this.getView().byId("table").getBinding("items").filter(oTableSearchState, "Application");
		},
		onMaterialCodeSearch1: function (oEvent) {
			var oTableSearchState = [],
				sQuery = oEvent.getParameter("newValue");
			if (sQuery && sQuery.length > 0) {
				oTableSearchState = [new Filter("MaterialCode", FilterOperator.Contains, sQuery)];
			}
			this.getView().byId("table1").getBinding("items").filter(oTableSearchState, "Application");
		},
		onMaterialNameSearch1: function (oEvent) {
			var oTableSearchState = [],
				sQuery = oEvent.getParameter("newValue");
			if (sQuery && sQuery.length > 0) {
				oTableSearchState = [new Filter("MaterialName", FilterOperator.Contains, sQuery)];
			}
			this.getView().byId("table1").getBinding("items").filter(oTableSearchState, "Application");
		},
		onPressDownload: function () {
			var aColm = [{
				label: "SCHEDULE NO",
				property: "ScheduleLine",
				type: "string"
			}, {
				label: "SCHEDULE NO",
				property: "ScheduleDate",
				type: sap.ui.export.EdmType.Date,
				inputFormat: "yyyymmdd"
			}, {
				label: "AGREEMENT ID",
				property: "AgreementId",
				type: "string"
			}, {
				label: "MATERIAL CODE",
				property: "MaterialCode",
				type: "string"
			}, {
				label: "MATERIAL NAME",
				property: "MaterialName",
				type: "string"
			}, {
				label: "Plant",
				property: "Plant",
				type: "string"
			}, {
				label: "ASN DATE",
				property: "AsnCreatedDate",
				type: sap.ui.export.EdmType.Date,
				inputFormat: "yyyymmdd"
			}, {
				label: "ASN QTY.",
				property: "ASNQty",
				type: "string"
			}, {
				label: "SCHEDULED QTY.",
				property: "ScheduleQty",
				type: "string"
			}, {
				label: "DELIVERED QTY.",
				property: "DeliveryQty",
				type: "string"
			}, {
				label: "INVOICE NO",
				property: "InvoiceNo",
				type: "string"
			}, {
				label: "INVOICE DATE",
				property: "InvoiceDate",
				type: sap.ui.export.EdmType.Date,
				inputFormat: "yyyymmdd"
			}, {
				label: "INVOICE VALUE",
				property: "InvoiceValue",
				type: "string"
			}, {
				label: "ASN NO.",
				property: "AsnId",
				type: "string"
			}];

			var dataResults = "";

			var oSettings = {
				workbook: {
					columns: aColm,
					hierarchyLevel: 'Level'
				},
				fileName: "PlannedVsActual",
				dataSource: this.getView().getModel("detailViewModel").getData().items

			};

			var oSheet = new Spreadsheet(oSettings);
			oSheet.build()
				.then(function () {
					MessageToast.show('Spreadsheet export has finished');
				})
				.finally(function () {
					oSheet.cancel();
				});
		}

	});

});