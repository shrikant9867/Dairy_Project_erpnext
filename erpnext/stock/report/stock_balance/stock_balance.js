// Copyright (c) 2015, Frappe Technologies Pvt. Ltd. and Contributors and contributors
// For license information, please see license.txt

frappe.query_reports["Stock Balance"] = {
	"filters": [
		{
			"fieldname":"from_date",
			"label": __("From Date"),
			"fieldtype": "Date",
			"width": "80",
			"reqd": 1,
			"default": frappe.sys_defaults.year_start_date,
		},
		{
			"fieldname":"to_date",
			"label": __("To Date"),
			"fieldtype": "Date",
			"width": "80",
			"reqd": 1,
			"default": frappe.datetime.get_today()
		},
		{
			"fieldname": "item_group",
			"label": __("Item Group"),
			"fieldtype": "Link",
			"width": "80",
			"options": "Item Group"
		},
		{
			"fieldname": "item_code",
			"label": __("Item"),
			"fieldtype": "Link",
			"width": "80",
			"options": "Item"
		},
		{
			"fieldname": "warehouse",
			"label": __("Warehouse"),
			"fieldtype": "Link",
			"width": "80",
			"options": "Warehouse",
			"get_query": function (query_report) {
				return {
					query:"dairy_erp.customization.stock_balance.stock_balance_report.get_filtered_warehouse"	
				}
			}
		},
		{
			"fieldname": "company",
			"label": __("Company"),
			"fieldtype": "Link",
			"width": "80",
			"options": "Company",
			"get_query": function (query_report) {
				return {
					query:"dairy_erp.customization.stock_balance.stock_balance_report.get_associated_vlcc"		
				}
			}
		},
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
					if(has_common(frappe.user_roles, ["Vlcc Operator", "Vlcc Manager"])){
						$('body').find("[data-fieldname=company]").val(r.message.company).prop("disabled",true)
						set_vlcc_wh(r.message.company)
					}
					else if(has_common(frappe.user_roles, ["Camp Operator", "Camp Manager"])){
						set_warehouse_filter(r.message.branch_office)
						if (in_list(frappe.user_roles,"Camp Operator")){
							$('body').find("[data-fieldname=company]").val(r.message.company).prop("disabled",true)
						}
						else if(in_list(frappe.user_roles, "Camp Manager")) {
							$('body').find("[data-fieldname=company]").val(r.message.company)
						}
					}
					else if(has_common(frappe.user_roles, ["Chilling Center Operator", "Chilling Center Manager"])){
						set_warehouse_filter(r.message.branch_office)
						$('body').find("[data-fieldname=company]").val(r.message.company).prop("disabled",true)
					}
					query_report.trigger_refresh();
				}
			}
		})
	}
}

set_warehouse_filter = function(branch_office) {
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
			else if (in_list(frappe.user_roles,"Camp Operator")){
				$('body').find("[data-fieldname=warehouse]").val(r.message.warehouse).prop("disabled",true)
			}
			else if(in_list(frappe.user_roles, "Camp Manager")) {
				$('body').find("[data-fieldname=warehouse]").val(r.message.warehouse)
			}
			else if(has_common(frappe.user_roles, ["Chilling Center Operator", "Chilling Center Manager"])){
				$('body').find("[data-fieldname=warehouse]").val(r.message.warehouse).prop("disabled",true)
			}
		}
	})
}

set_vlcc_wh = function(company){
	frappe.call({
		method: "frappe.client.get_value",
		args: {
			doctype: "Village Level Collection Centre",
			filters: {"name": company},
			fieldname: "warehouse"
		},
		async: false,
		callback: function(r) {
			if(r.exc || !r.message.warehouse) {
				frappe.throw(__("Unable to find warehoue for <b>{0}</b>", (company)))
			}
			else if(has_common(frappe.user_roles, ["Vlcc Operator", "Vlcc Manager"])){
				$('body').find("[data-fieldname=warehouse]").val(r.message.warehouse)
			}
		}
	})

}

