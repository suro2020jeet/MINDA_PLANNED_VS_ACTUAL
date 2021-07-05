sap.ui.define([
	"sap/base/util/UriParameters",
	"sap/ui/core/UIComponent",
	"sap/ui/model/json/JSONModel",
	"sap/f/library",
	"sap/f/FlexibleColumnLayoutSemanticHelper",
	"com/minda/PlanVactual/model/models"
], function (UriParameters, UIComponent, JSONModel, library, FlexibleColumnLayoutSemanticHelper, models) {
	"use strict";
	var LayoutType = library.LayoutType;

	return UIComponent.extend("com.minda.PlanVactual.Component", {

		metadata: {
			manifest: "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function () {
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			// set products demo model on this sample
			// enable routing
			this.getRouter().initialize();

			// set the device model
			this.setModel(models.createDeviceModel(), "device");
		},
		// getHelper: function () {
		// 	var oFCL = this.getRootControl().byId("App"),
		// 		oParams = UriParameters.fromQuery(location.search),
		// 		oSettings = {
		// 			defaultTwoColumnLayoutType: LayoutType.TwoColumnsMidExpanded,
		// 			defaultThreeColumnLayoutType: LayoutType.ThreeColumnsMidExpanded,
		// 			mode: oParams.get("mode"),
		// 			initialColumnsCount: 2,
		// 			maxColumnsCount: oParams.get("max")
		// 		};

		// 	return FlexibleColumnLayoutSemanticHelper.getInstanceFor(oFCL, oSettings);
		// }
	});
});