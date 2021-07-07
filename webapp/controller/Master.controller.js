sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"com/minda/PlanVactual/controller/BaseController",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	'sap/ui/model/Sorter',
	'sap/m/MessageBox',
	"sap/ui/core/Element",
	"sap/m/MessageToast",
	"com/minda/PlanVactual/model/formatter"
], function (JSONModel, Controller, Filter, FilterOperator, Sorter, MessageBox, Element, MessageToast, formatter) {
	"use strict";

	return Controller.extend("com.minda.PlanVactual.controller.Master", {
		formatter: formatter,
		onInit: function () {
			// debugger;
			this.getOwnerComponent().setModel(new JSONModel({
				busy: false,
				PageNumber: "1",
				columListItemSelected: true,
				plant: "1031",
				showAdvancedSearch: false,
				vendor: "0000200323"
			}), "listViewModel");
			this.oRouter = this.getOwnerComponent().getRouter();
			this._bDescendingSort = false;
			if (!sap.ushell) {} else {
				if (sap.ui.getCore().plants != undefined) {
					if (sap.ui.getCore().plants.hasOwnProperty("plant")) {
						if (sap.ui.getCore().plants.plant) {
							this.getOwnerComponent().getModel("listViewModel").setProperty("/plant", sap.ui.getCore().plants.plant);
							this._getMasterListData(this.getOwnerComponent().getModel("listViewModel").getProperty("/PageNumber"));
							this.oRouter.navTo("detail", {
								AgreementNo: "all"
							});
						}
					}
					sap.ui.getCore().plants.registerListener(function (val) {
						if (val) {
							this.getOwnerComponent().getModel("listViewModel").setProperty("/plant", val);
							this._getMasterListData(this.getOwnerComponent().getModel("listViewModel").getProperty("/PageNumber"));
							this.oRouter.navTo("detail", {
								AgreementNo: "all"
							});
						}
					}.bind(this));
				}
			}
			// this._getUserDetails();
			// this._getMasterListData(this.getOwnerComponent().getModel("listViewModel").getProperty("/PageNumber"));
			// this.oRouter.navTo("detail", {
			// 	AgreementNo: "all"
			// });
		},
		onAllOrderPress: function () {
			for (var i = 0; i < this.byId("table").getItems().length; i++) {
				this.byId("table").getItems()[i].setSelected(false);
			}
			this.oRouter.navTo("detail", {
				AgreementNo: "all"
			});
		},
		onListItemPress: function (oEvent) {
			this.getOwnerComponent().getModel("listViewModel").setProperty("/columListItemSelected", false);
			oEvent.getParameter("listItem").setSelected(true);
			this.oRouter.navTo("detail", {
				AgreementNo: oEvent.getParameter("listItem").getBindingContext("aggrements").getObject().AgreementNo
			});
		},
		onSearch: function (oEvent) {
			var oTableSearchState = [],
				sQuery = oEvent.getParameter("newValue");
			if (sQuery && sQuery.length > 0) {
				oTableSearchState = [new Filter("AgreementNo", FilterOperator.Contains, sQuery)];
			}
			this.getView().byId("table").getBinding("items").filter(oTableSearchState, "Application");
		},

		onSort: function (oEvent) {
			this._bDescendingSort = !this._bDescendingSort;
			var oView = this.getView(),
				oTable = oView.byId("table"),
				oBinding = oTable.getBinding("items"),
				oSorter = new Sorter("AgreementNo", this._bDescendingSort);
			oBinding.sort(oSorter);
		},
		onUpdateFinished: function (oEvent) {
			var oParams = oEvent.getParameters();
			if (oParams.reason !== "Growing") {
				return;
			}
			var PageNumber = (parseInt(this.getOwnerComponent().getModel("listViewModel").getProperty("/PageNumber")) + 1) + "";
			this.getOwnerComponent().getModel("listViewModel").setProperty("/PageNumber", PageNumber);
			this._getMasterListData(this.getOwnerComponent().getModel("listViewModel").getProperty("/PageNumber"));

		},
		_applyFilter: function (oFilter) {
			var oTable = this.byId("table");
			oTable.getBinding("items").filter(oFilter);
		},

		handleFacetFilterReset: function (oEvent) {
			var oFacetFilter = Element.registry.get(oEvent.getParameter("id")),
				aFacetFilterLists = oFacetFilter.getLists();

			for (var i = 0; i < aFacetFilterLists.length; i++) {
				aFacetFilterLists[i].setSelectedKeys();
			}

			this._applyFilter([]);
		},

		handleListClose: function (oEvent) {
			// Get the Facet Filter lists and construct a (nested) filter for the binding
			var oFacetFilter = oEvent.getSource().getParent();

			this._filterModel(oFacetFilter);
		},

		handleConfirm: function (oEvent) {
			// Get the Facet Filter lists and construct a (nested) filter for the binding
			var oFacetFilter = oEvent.getSource();
			this._filterModel(oFacetFilter);
			MessageToast.show("confirm event fired");
		},

		_filterModel: function (oFacetFilter) {
			var mFacetFilterLists = oFacetFilter.getLists().filter(function (oList) {
				return oList.getSelectedItems().length;
			});

			if (mFacetFilterLists.length) {
				// Build the nested filter with ORs between the values of each group and
				// ANDs between each group
				var oFilter = new Filter(mFacetFilterLists.map(function (oList) {
					return new Filter(oList.getSelectedItems().map(function (oItem) {
						return new Filter(oList.getKey(), "EQ", oItem.getText());
					}), false);
				}), true);
				this._applyFilter(oFilter);
			} else {
				this._applyFilter([]);
			}
		},
		onChangePlant: function (oEvent) {
			debugger;
			this.getOwnerComponent().getModel("listViewModel").setProperty("/plant", oEvent.getSource().getSelectedItem().getKey());
			jQuery.ajax({
				type: "GET",
				contentType: "application/x-www-form-urlencoded",
				headers: {
					"Authorization": "Basic NDMyYjNjZjMtNGE1OS0zOWRiLWEwMWMtYzM5YzhjNGYyNTNkOjk2NTJmOTM0LTkwMmEtMzE1MS05OWNiLWVjZTE1MmJkZGQ1NA=="
				},
				url: "/token/accounts/c70391893/plant/vendors?plantId=" + oEvent.getSource().getSelectedItem().getKey(),
				dataType: "json",
				async: false,
				success: function (data, textStatus, jqXHR) {
					this.plants = data.plants;
					this.getOwnerComponent().setModel(new JSONModel(data), "vendorModel");
				}.bind(this),
				error: function (data) {
					// console.log("error", data);
				}
			});
		},
		onChangeVendor: function (oEvent) {
			this.getOwnerComponent().getModel("listViewModel").setProperty("/vendor", oEvent.getSource().getSelectedItem().getKey());
		},
		onAdvancedSearchPress: function () {
			if (!this._oDialog) {
				this._oDialog = sap.ui.xmlfragment("com.minda.PlanVactual.fragments.AdvancedSearch", this);
				this.getView().addDependent(this._oDialog);
			}
			this._oDialog.open();
		},
		onPressCloseDialog: function () {
			this._oDialog.close();
		},
		onPressApply: function () {
			this._oDialog.close();
			this._getMasterListData(this.getOwnerComponent().getModel("listViewModel").getProperty("/PageNumber"));
		}

	});

});