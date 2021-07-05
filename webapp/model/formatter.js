sap.ui.define([], function () {
	return {
		setDate: function (sValue) {
			var date;
			if (sValue == null || sValue == "" || sValue == undefined) {
				date = new Date();
			} else {
				if (typeof (sValue) == 'object') {
					date = sValue;
				} else {
					date = new Date();
				}

			}
			var months = ["01", "02", "03", "04", "05", "06",
				"07", "08", "09", "10", "11", "12"
			];
			var m = months[date.getMonth()];
			var d = String(date.getDate()).padStart(2, '0');
			var y = date.getFullYear();
			return m + '.' + d + '.' + y;
		}
	};
});