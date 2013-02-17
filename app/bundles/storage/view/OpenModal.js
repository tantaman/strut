define(['./AbstractStorageModal', 'lang'],
function(AbstractModal, lang) {
	return AbstractModal.extend({
		__actionPerformed: function() {
			
		},

		__title: function() {
			return lang.open;
		}
	});
});