// Copyright (c) 2015, Frappe Technologies Pvt. Ltd. and Contributors
// License: GNU General Public License v3. See license.txt

frappe.query_reports["Accounts Receivable"] = {
	"filters": [
		{
			"fieldname":"company",
			"label": __("Company"),
			"fieldtype": "Link",
			"options": "Company",
			"default": frappe.defaults.get_user_default("Company")
		},
		{
			"fieldname":"customer",
			"label": __("Customer"),
			"fieldtype": "Link",
			"options": "Customer",
			"get_query": function (query_report) {
				dairy_roles = ["Dairy Manager", "Dairy Operator"]
				user_ = frappe.session.user
				if(user_ != "Administrator" && has_common(frappe.user_roles, dairy_roles)) {
					 return{
							  query:"dairy_erp.customization.customization.get_filtered_customer"
						  }
				}
				 
			  }
		},
		{
			"fieldname":"customer_group",
			"label": __("Customer Group"),
			"fieldtype": "Link",
			"options": "Customer Group",
			// "get_query": function (query_report) {
			// 	 return{
			// 			  "filters": {
			// 			   		"name": ["!=", "Farmer"],
			// 			   }
			// 		  }
			//   }
		},
		{
			"fieldname":"credit_days_based_on",
			"label": __("Credit Days Based On"),
			"fieldtype": "Select",
			"options": "\nFixed Days\nLast Day of the Next Month"
		},
		{
			"fieldname":"account",
			"label": __("Account"),
			"fieldtype": "Link",
			"options": "Account"
		},
		{
			"fieldtype": "Break",
		},
		{
			"fieldname":"report_date",
			"label": __("As on Date"),
			"fieldtype": "Date",
			"default": frappe.datetime.get_today()
		},
		{
			"fieldname":"ageing_based_on",
			"label": __("Ageing Based On"),
			"fieldtype": "Select",
			"options": 'Posting Date\nDue Date',
			"default": "Posting Date"
		},
		{
			"fieldname":"range1",
			"label": __("Ageing Range 1"),
			"fieldtype": "Int",
			"default": "30",
			"reqd": 1
		},
		{
			"fieldname":"range2",
			"label": __("Ageing Range 2"),
			"fieldtype": "Int",
			"default": "60",
			"reqd": 1
		},
		{
			"fieldname":"range3",
			"label": __("Ageing Range 3"),
			"fieldtype": "Int",
			"default": "90",
			"reqd": 1
		}
	],

	onload: function(report) {
		report.page.add_inner_button(__("Accounts Receivable Summary"), function() {
			var filters = report.get_values();
			frappe.set_route('query-report', 'Accounts Receivable Summary', {company: filters.company});
		});
		// set default camp office income account as account
		frappe.call({
			method: "dairy_erp.customization.sales_invoice.sales_invoice.get_account_invoice",
			callback: function(r) {
				if(!r.exc && r.message) {
					$('body').find("[data-fieldname=account]").val(r.message.income_account).prop("disabled",true)
				}
			}
		})
		user_data = get_session_user_type()
		if(!in_list(["Administrator", "Guest"], frappe.session.user)){
			$('body').find("[data-fieldname=company]").val(user_data.company).prop("disabled",true)
		}
	}
}


get_session_user_type = function() {
	var user;
	frappe.call({
		method: "frappe.client.get_value",
		args: {
			doctype: "User",
			filters: {"name": frappe.session.user},
			fieldname: ["operator_type","company"]
		},
		async:false,
		callback: function(r){
			if(r.message){	
	
				user = {
					"operator_type": r.message.operator_type,
					"company": r.message.company
				}		
			}
		}
	});

	return user
}


