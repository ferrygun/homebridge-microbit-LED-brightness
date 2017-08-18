var Service, Characteristic;
var request = require("request");
var BBCMicrobit = require('bbc-microbit')

var EVENT_FAMILY = 8888;
var EVENT_VALUE_ANY = 0;

var microbit_;
var brightness = 0;

console.log('Scanning for microbit');
BBCMicrobit.discover(function(microbit) {
    console.log('\tdiscovered microbit: id = %s, address = %s', microbit.id, microbit.address);


    microbit.on('event', function(id, value) {
        console.log('\ton -> micro:bit event received event: %d value: %d', id, value);
    });

    microbit.on('disconnect', function() {
        console.log('\tmicrobit disconnected!');
        process.exit(0);
    });

    console.log('connecting to microbit');
    microbit.connectAndSetUp(function() {
        console.log('\tconnected to microbit');
        console.log('subscribing to event family, any event value');
        microbit.subscribeEvents(EVENT_VALUE_ANY, EVENT_FAMILY, function() {
            console.log('\tsubscribed to micro:bit events of required type');
        });

        microbit_ = microbit;
    });

});



module.exports = function (homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory("homebridge-microbit", "Microbit", microbitAccessory);
};


function microbitAccessory(log, config) {
    this.log = log;

    this.status_on = config["status_on"];
    this.status_off = config["status_off"];
    this.service = config["service"] || "Switch";
    this.name = config["name"];
    this.brightnessHandling = config["brightnessHandling"] || "no";
    this.switchHandling = config["switchHandling"] || "no";


    //realtime polling info
    this.state = false;
    this.currentlevel = 0;
    this.enableSet = true;
    var that = this;
}

function clamp(number, min, max) {
    return Math.max(min,Math.min(number,max));
}

microbitAccessory.prototype = {


    setPowerState: function (powerState, callback) {
        this.log("Power On", powerState);
        this.log("Enable Set", this.enableSet);
        this.log("Current Level", this.currentlevel);
        if (this.enableSet === true) {
            if (powerState) {
                this.log("Setting power state to on");
                microbit_.writeEvent(brightness, EVENT_FAMILY, function() {
                    console.log('On');
                });
                
            } else {
                this.log("Setting power state to off");
                microbit_.writeEvent(0, EVENT_FAMILY, function() {
                    console.log('Off');
                });
            }
            callback();
            
        } else {
            callback();
        }
    },


    getBrightness: function (callback) {
        this.log("Getting Brightness level");

        callback();
    },

    setBrightness: function (level, callback) {
        if (this.enableSet === true) {

            
            this.log("Setting brightness to %s", level);

            brightness = clamp(level, 0, 100) * 10;

            microbit_.writeEvent(brightness, EVENT_FAMILY, function() {
                console.log('On');
            });
            console.log("Setting brightness to " + level);


            callback();
        } else {
            callback();
        }
    },

    identify: function (callback) {
        this.log("Identify requested!");
        callback(); // success
    },

    getServices: function () {

        var that = this;

        // you can OPTIONALLY create an information service if you wish to override
        // the default values for things like serial number, model, etc.
        var informationService = new Service.AccessoryInformation();

        informationService
        .setCharacteristic(Characteristic.Manufacturer, "HTTP Manufacturer")
        .setCharacteristic(Characteristic.Model, "HTTP Model")
        .setCharacteristic(Characteristic.SerialNumber, "HTTP Serial Number");

        switch (this.service) {
            case "Switch":
                this.switchService = new Service.Switch(this.name);

                this.switchService
                        .getCharacteristic(Characteristic.On)
                        .on("get", function (callback) {
                            callback(null, that.state)
                        })
                        .on("set", this.setPowerState.bind(this));

                return [this.switchService];
            case "Light":
                this.lightbulbService = new Service.Lightbulb(this.name);

                this.lightbulbService
                        .getCharacteristic(Characteristic.On)
                        .on("get", function (callback) {
                            callback(null, that.state)
                        })
                        .on("set", this.setPowerState.bind(this));

                // Brightness Polling
                if (this.brightnessHandling === "realtime") {
                    this.lightbulbService
                    .addCharacteristic(new Characteristic.Brightness())
                    .on("get", function (callback) {
                        callback(null, that.currentlevel)
                    })
                    .on("set", this.setBrightness.bind(this));
                } else if (this.brightnessHandling === "yes") {
                    this.lightbulbService
                    .addCharacteristic(new Characteristic.Brightness())
                    .on("get", this.getBrightness.bind(this))
                    .on("set", this.setBrightness.bind(this));
                }

                return [informationService, this.lightbulbService];
                break;
        }
    }
};