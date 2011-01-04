var FN = (function() {

    return {

        persistentSettingsKeys: {
            unsecure: ['nextpattern', 'prevpattern']
        },

        init: function() {

            safari.application.addEventListener('message', function(msg) {
                FN[msg.name](msg.message, msg.target);
            }, false);

            safari.extension.settings.addEventListener("change", this.saveSettingsToLocalStorage, false);
            safari.extension.secureSettings.addEventListener("change", this.saveSettingsToLocalStorage, false);

            this.retrieveSettingsFromLocalStorage();
        },

        retrieveSettingsFromLocalStorage: function() {
            var keys = FN.persistentSettingsKeys;
            for (x in keys.secure) {
                if (!safari.extension.secureSettings[keys.secure[x]]) {
                    safari.extension.secureSettings.setItem(keys.secure[x], localStorage.getItem(keys.secure[x]));
                }
            }
            for (x in keys.unsecure) {
                if (!safari.extension.settings.getItem(keys.unsecure[x])) {
                    safari.extension.settings.setItem(keys.unsecure[x], localStorage.getItem(keys.unsecure[x]));
                }
            }
        },

        saveSettingsToLocalStorage: function(e) {
            var keys = FN.persistentSettingsKeys;
            for (x in keys.secure) {
                localStorage.setItem(keys.secure[x], safari.extension.secureSettings.getItem(keys.secure[x]));
            }
            for (x in keys.unsecure) {
                localStorage.setItem(keys.unsecure[x], safari.extension.settings.getItem(keys.unsecure[x]));
            }
        },

        initConfig: function(data, target) {
            target.page.dispatchMessage('configCallback', {
                'previous' : safari.extension.settings.getItem('prevpattern'),
                'next'     : safari.extension.settings.getItem('nextpattern')
            });
        }
    };
})();

FN.init();
