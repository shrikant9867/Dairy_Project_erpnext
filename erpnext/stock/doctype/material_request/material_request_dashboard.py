from frappe import _


def get_data():
	return {
		'fieldname': 'material_request',
		'transactions': [
			{
				'label': _('Related'),
				'items': ['Purchase Order']
			}
		]
	}