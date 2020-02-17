/**
 * Created by koc on 01/05/2017.
 */
'use strict';

const nconf = require('nconf').file({file: getUserHome() + '/sound-machine-config.json'});

function saveSettings(settingKey, settingValue) {
    nconf.set(settingKey, settingValue);
    nconf.save();
}

function readSettings(settingKey) {
    nconf.load();
    return nconf.get(settingKey);
}

function updateSettings(settingKey, func) {
    nconf.load();
    nconf.set(settingKey, func(nconf.get(settingKey)));
    nconf.save();
}

function getUserHome() {
    return process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
}

module.exports = {
    saveSettings: saveSettings,
    readSettings: readSettings,
    updateSettings: updateSettings
};