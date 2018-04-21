// Copyright (c) 2015, Frappe Technologies Pvt. Ltd. and Contributors
// License: GNU General Public License v3. See license.txt

frappe.query_reports["Stock Ledger"] = {
	"filters": [
		{
			"fieldname":"company",
			"label": __("Company"),
			"fieldtype": "Link",
			"options": "Company",
			"default": frappe.defaults.get_user_default("Company"),
			"reqd": 1
		},
		{
			"fieldname":"from_date",
			"label": __("From Date"),
			"fieldtype": "Date",
			"default": frappe.datetime.add_months(frappe.datetime.get_today(), -1),
			"reqd": 1
		},
		{
			"fieldname":"to_date",
			"label": __("To Date"),
			"fieldtype": "Date",
			"default": frappe.datetime.get_today(),
			"reqd": 1
		},
		{
			"fieldname":"warehouse",
			"label": __("Warehouse"),
			"fieldtype": "Link",
			"options": "Warehouse"
		},
		{
			"fieldname":"item_code",
			"label": __("Item"),
			"fieldtype": "Link",
			"options": "Item"
		},
		{
			"fieldname":"item_group",
			"label": __("Item Group"),
			"fieldtype": "Link",
			"options": "Item Group"
		},
		{
			"fieldname":"batch_no",
			"label": __("Batch No"),
			"fieldtype": "Link",
			"options": "Batch"
		},
		{
			"fieldname":"brand",
			"label": __("Brand"),
			"fieldtype": "Link",
			"options": "Brand"
		},
		{
			"fieldname":"voucher_no",
			"label": __("Voucher #"),
			"fieldtype": "Data"
		}
	],
	onload: function(query_report) {
		frappe.call({
			method: "frappe.client.get_value",
			args: {
				doctype: "User",
				filters: {"name": frappe.session.user},
				fieldname: ["operator_type","company", "branch_office"]
			},
			callback: function(r) {
				if(!r.exc && r.message) {
					if(r.message.operator_type == "VLCC") {
						$('body').find("[data-fieldname=company]").val(r.message.company).prop("disabled",true)
					}
					if(in_list(["Chilling Centre", "Camp Office"],r.message.operator_type)) {
						set_warehouse_filter(r.message.branch_office, r.message.company)
					}
					query_report.trigger_refresh();
				}
			}
		})
	}
}

set_warehouse_filter = function(branch_office, company) {
	frappe.call({
		method: "frappe.client.get_value",
		args: {
			doctype: "Address",
			filters: {"name": branch_office},
			fieldname: "warehouse"
		},
		async: false,
		callback: function(r) {
			if(r.exc || !r.message.warehouse) {
				frappe.throw(__("Unable to find warehoue for <b>{0}</b>", (branch_office)))
			}
			$('body').find("[data-fieldname=company]").val(company).prop("disabled",true)
			$('body').find("[data-fieldname=warehouse]").val(r.message.warehouse).prop("disabled",true)
		}
	})
}

// $(function() {
// 	$(wrapper).bind("show", function() {
// 		frappe.query_report.load();
// 	});
// });