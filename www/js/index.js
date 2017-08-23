/* global mainPage, deviceList */
/* global ble  */
'use strict';

var app = {
    initialize: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    onDeviceReady: function() {
        deviceList.innerHTML = '';
        ble.startScanWithOptions([], {
            reportDuplicates: true
        }, app.onDiscoverDevice, app.onError);
    },
    onDiscoverDevice: function(device) {

        if (device.name.match(/tjlscale/i) || device.name.match(/doctorfit/i)) {

            var adData = new Uint8Array(device.advertising);
            adData = adData.slice(8, 14);
            var state = app.compileState(adData);

            var html = 'Name: <b>' + device.name + '</b><br/>' +
                'RSSI: ' + device.rssi +
                '<br/>MAC:' + device.id +
                '<br/>Measurement: ' + state.measurement + ' ' + state.unit +
                '<br/>Battery low: ' + state.batt_low +
                '<br/>Overload: ' + state.overload +
                '<br/>Measurement still: ' + state.measurement_still;

            deviceList.innerHTML = html;


        }
    },
    onError: function(reason) {
        alert("ERROR: " + reason);
    },
    compileState: function(data) {
        var state = {
            unit: '',
            measurement: 0.0,
            negative: false,
            batt_low: false,
            overload: false,
            measurement_still: false
        };

        state.unit = app.getUnit(data[0]);
        var hex_components = [data[2] >> 4, data[3] >> 4, data[4] >> 4, data[5] >> 4];
        state.batt_low = (data[1] & 4) > 0;
        state.negative = (data[1] & 8) > 0;
        state.overload = (data[1] & 2) > 0;
        state.measurement_still = (data[1] & 1) > 0;

        var hex_string = '';
        for (var i = 0; i < hex_components.length; i++) {
            hex_string = hex_string + hex_components[i].toString(16);
        }
        state.measurement = parseInt(hex_string, 16);
        state.measurement = app.calculateUnit(data[0], state.measurement);

        if (state.negative) {
            state.measurement = state.measurement * -1;
        }

        return state;
    },
    getUnit: function(num) {
        var unitMap = {
            1: 'g',
            2: 'oz',
            4: 'oz:lb',
            8: 'ml',
            16: 'fl.oz',
            20: 'kg'
        };
        return unitMap[num];
    },
    calculateUnit: function(unit_num, value) {
        var calcMap = {
            1: function(e) {
                return e
            },
            2: function(e) {
                var t = 35.274 * e / 100;
                return Math.round(t) / 10
            },
            4: function(e) {
                var t = 3.5273962 * e / 100,
                    A = parseInt(t / 16),
                    n = t - 16 * A;
                n = n.toFixed(1);
                var I = A + ":" + n;
                return I
            },
            8: function(e) {
                return e
            },
            16: function(e) {
                var t = 35.195 * e / 100;
                return Math.round(t) / 10
            },
            20: function(e) {
                return e / 1e3
            }
        };
        return calcMap[unit_num](value)
    }
};
