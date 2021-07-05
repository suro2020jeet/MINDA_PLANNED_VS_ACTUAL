sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function (Controller) {
	"use strict";

	return Controller.extend("com.minda.PlanVactual.controller.App", {
		onInit: function(){
			this.getOwnerComponent().setModel(new sap.ui.model.json.JSONModel({layout: "TwoColumnsMidExpanded"}), "layout")
		}
	});
});