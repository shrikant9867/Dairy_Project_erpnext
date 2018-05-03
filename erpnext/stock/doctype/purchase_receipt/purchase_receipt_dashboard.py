from frappe import _

def get_data():
	return {
		'fieldname': 'purchase_receipt_no',
		'non_standard_fieldnames': {
			'Purchase Invoice': 'purchase_receipt',
			'Landed Cost Voucher': 'receipt_document',
			'Subscription': 'reference_document'
		},
		'internal_links': {
			'Purchase Order': ['items', 'purchase_order'],
			'Project': ['items', 'project'],
			'Quality Inspection': ['items', 'quality_inspection'],
		},
		'transactions': [
			{
				'label': _('Reference'),
				'items': ['Purchase Order', 'Quality Inspection', 'Project']
			},
			{
				'label': _('Returns'),
				'items': ['Stock Entry']
			},
			{
				'label': _('Subscription'),
				'items': ['Subscription']
			},
		]
	}