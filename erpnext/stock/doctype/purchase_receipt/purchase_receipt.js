// Copyright (c) 2015, Frappe Technologies Pvt. Ltd. and Contributors
// License: GNU General Public License v3. See license.txt

{% include 'erpnext/public/js/controllers/buying.js' %};

frappe.provide("erpnext.stock");

frappe.ui.form.on("Purchase Receipt", {
	setup: function(frm) {
		frm.custom_make_buttons = {
			'Stock Entry': 'Return',
			'Purchase Invoice': 'Invoice'
		}
	},
	onload: function(frm) {
		$.each(["warehouse", "rejected_warehouse"], function(i, field) {
			frm.set_query(field, "items", function() {
				return {
					filters: [
						["Warehouse", "company", "in", ["", cstr(frm.doc.company)]],
						["Warehouse", "is_group", "=", 0]
					]
				}
			})
		})

		frm.set_query("supplier_warehouse", function() {
			return {
				filters: [
					["Warehouse", "company", "in", ["", cstr(frm.doc.company)]],
					["Warehouse", "is_group", "=", 0]
				]
			}
		});

	},

	refresh: function(frm) {
		if(frm.doc.company) {
			frm.trigger("toggle_display_account_head");
		}
		if(cur_frm.doc.items){
			cur_frm.cscript.non_editable_qty();
		}
	},

	company: function(frm) {
		frm.trigger("toggle_display_account_head");
	},

	toggle_display_account_head: function(frm) {
		var enabled = erpnext.is_perpetual_inventory_enabled(frm.doc.company)
		frm.fields_dict["items"].grid.set_column_disp(["cost_center"], enabled);
	},
});

erpnext.stock.PurchaseReceiptController = erpnext.buying.BuyingController.extend({
	setup: function(doc) {
		this.setup_posting_date_time_check();
		this._super(doc);
	},

	refresh: function() {
		var me = this;
		this._super();
		if(this.frm.doc.docstatus===1) {
			this.show_stock_ledger();
			if (erpnext.is_perpetual_inventory_enabled(this.frm.doc.company)) {
				this.show_general_ledger();
			}
		}
		frappe.call({
				method: "frappe.client.get_value",
				async : false,
				args: {
					doctype: "User",
					filters: {"name": frappe.session.user},
					fieldname: ["branch_office","operator_type"]
				},
				callback: function(r){
					if(r.message){
						me.branch_office = r.message.branch_office
						me.operator_type =r.message.operator_type
					}
				}
			});

		if(!this.frm.doc.is_return && this.frm.doc.status!="Closed") {
			if (this.frm.doc.docstatus == 0) {
				this.frm.add_custom_button(__('Purchase Order'),
					function () {
						erpnext.utils.map_current_doc({
							method: "erpnext.buying.doctype.purchase_order.purchase_order.make_purchase_receipt",
							source_doctype: "Purchase Order",
							target: me.frm,
							setters: {
								supplier: me.frm.doc.supplier || undefined,
							},
							get_query_filters: {
								docstatus: 1,
								status: ["!=", "Closed"],
								per_received: ["<", 99.99],
								is_dropship: 0,
								company: me.frm.doc.company
							}
						})
					}, __("Get items from"));
				if(me.operator_type == "VLCC"){
					this.frm.add_custom_button(__('Material Request'),
						function() {
							erpnext.utils.map_current_doc({
								method: "erpnext.stock.doctype.material_request.material_request.make_purchase_receipt",
								source_doctype: "Material Request",
								target: me.frm,
								setters: {
									company: me.frm.doc.company,
									// camp_office:me.branch_office
								},
								get_query_filters: {
									material_request_type: "Purchase",
									docstatus: 1,
									is_dropship: 1,
									status: ["in", ["Ordered","Partially Delivered"]]
								}
							})
						// make items table read only for vlcc when do PR for MI
						//me.frm.set_df_property("items", "read_only",1);	
						//cur_frm.cscript.non_editable_qty();
						}, __("Get items from"));
				}
			}

			if(this.frm.doc.docstatus == 1 && this.frm.doc.status!="Closed") {
				if (this.frm.has_perm("submit")) {
					cur_frm.add_custom_button(__("Close"), this.close_purchase_receipt, __("Status"))
				}

				cur_frm.add_custom_button(__('Return'), this.make_purchase_return, __("Make"));

				// Add condition when supplier type is 
				// VLCC local then No option of Invoice
				if(flt(this.frm.doc.per_billed) < 100 && this.frm.doc.supplier_type != "VLCC Local") {
					cur_frm.add_custom_button(__('Invoice'), this.make_purchase_invoice, __("Make"));
				}

				if(!this.frm.doc.subscription) {
					cur_frm.add_custom_button(__('Subscription'), function() {
						erpnext.utils.make_subscription(me.frm.doc.doctype, me.frm.doc.name)
					}, __("Make"))
				}

				cur_frm.page.set_inner_btn_group_as_primary(__("Make"));
			}
		}

		if(this.frm.doc.docstatus==1 && this.frm.doc.status === "Closed" && this.frm.has_perm("submit")) {
			cur_frm.add_custom_button(__('Reopen'), this.reopen_purchase_receipt, __("Status"))
		}

		this.frm.toggle_reqd("supplier_warehouse", this.frm.doc.is_subcontracted==="Yes");
	},


	// make qty read only for vlcc when do PR for MI
	items_on_form_rendered: function(frm, cdt, cdn) {
		cur_frm.cscript.toggle_editable_qty(frm, cdt, cdn);
	},

	make_purchase_invoice: function() {
		frappe.model.open_mapped_doc({
			method: "erpnext.stock.doctype.purchase_receipt.purchase_receipt.make_purchase_invoice",
			frm: cur_frm
		})
	},

	make_purchase_return: function() {
		frappe.model.open_mapped_doc({
			method: "erpnext.stock.doctype.purchase_receipt.purchase_receipt.make_purchase_return",
			frm: cur_frm
		})
	},

	close_purchase_receipt: function() {
		cur_frm.cscript.update_status("Closed");
	},

	reopen_purchase_receipt: function() {
		cur_frm.cscript.update_status("Submitted");
	}

});

// make qty read only for vlcc when do PR for MI
cur_frm.cscript.toggle_editable_qty = function(frm, cdt, cdn) {
	var row = cur_frm.open_grid_row().doc
	frappe.call({
		method: "dairy_erp.customization.purchase_receipt.purchase_receipt.make_mi_qty_editable",
		callback: function(r){
			if(r.message && r.message == "True"){
				if(row.material_request && row.qty) {
					cur_frm.open_grid_row().toggle_editable("qty", false);
					$('.grid-delete-row').hide();
				}
				else {
			     	cur_frm.open_grid_row().toggle_editable("qty", true);
				}
			}
		}
	});
}

cur_frm.cscript.non_editable_qty = function() {
	frappe.call({
		method: "dairy_erp.customization.purchase_receipt.purchase_receipt.make_mi_qty_editable",
		callback: function(r){
			if(r.message && r.message == "True"){
				$.each(cur_frm.doc.items,function(i,d){
					console.log(d.material_request,"material_request",i)
					if(d.material_request){
						$('[data-fieldname=items]').find('[data-idx='+d.idx+']').find('[data-fieldname=qty]').addClass("non_editable_field")
						$('[data-fieldname=items]').find('[data-idx='+d.idx+']').find('.grid-row-check').addClass("non_editable_field")
					}
				})
			}
		}
	});
}


// for backward compatibility: combine new and previous states
$.extend(cur_frm.cscript, new erpnext.stock.PurchaseReceiptController({frm: cur_frm}));

cur_frm.cscript.update_status = function(status) {
	frappe.ui.form.is_saving = true;
	frappe.call({
		method:"erpnext.stock.doctype.purchase_receipt.purchase_receipt.update_purchase_receipt_status",
		args: {docname: cur_frm.doc.name, status: status},
		callback: function(r){
			if(!r.exc)
				cur_frm.reload_doc();
		},
		always: function(){
			frappe.ui.form.is_saving = false;
		}
	})
}

cur_frm.fields_dict['items'].grid.get_field('project').get_query = function(doc, cdt, cdn) {
	return {
		filters: [
			['Project', 'status', 'not in', 'Completed, Cancelled']
		]
	}
}

cur_frm.cscript.select_print_heading = function(doc, cdt, cdn) {
	if(doc.select_print_heading)
		cur_frm.pformat.print_heading = doc.select_print_heading;
	else
		cur_frm.pformat.print_heading = "Purchase Receipt";
}

cur_frm.fields_dict['select_print_heading'].get_query = function(doc, cdt, cdn) {
	return {
		filters: [
			['Print Heading', 'docstatus', '!=', '2']
		]
	}
}

cur_frm.fields_dict['items'].grid.get_field('bom').get_query = function(doc, cdt, cdn) {
	var d = locals[cdt][cdn]
	return {
		filters: [
			['BOM', 'item', '=', d.item_code],
			['BOM', 'is_active', '=', '1'],
			['BOM', 'docstatus', '=', '1']
		]
	}
}

cur_frm.cscript.on_submit = function(doc, cdt, cdn) {
	if(cint(frappe.boot.notification_settings.purchase_receipt))
		cur_frm.email_doc(frappe.boot.notification_settings.purchase_receipt_message);
}

frappe.provide("erpnext.buying");

frappe.ui.form.on("Purchase Receipt", "is_subcontracted", function(frm) {
	if (frm.doc.is_subcontracted === "Yes") {
		erpnext.buying.get_default_bom(frm);
	}
	frm.toggle_reqd("supplier_warehouse", frm.doc.is_subcontracted==="Yes");
});