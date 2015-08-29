var EventEmitter = require('events').EventEmitter;
var util = require('util');
var mdns = require('mdns');
var _ = require('underscore');

var machinekitTcp = mdns.makeServiceType('machinekit', 'tcp');
function MachineTalkBrowser() {
	this.machines = {};
	this.browser = mdns.createBrowser(machinekitTcp);
	this.browser.on('serviceUp', this._handleServiceUp.bind(this));
	this.browser.on('serviceDown', this._handleServiceDown.bind(this));
}
util.inherits(MachineTalkBrowser, EventEmitter);
MachineTalkBrowser.prototype.start = function() {
	this.browser.start();
};
MachineTalkBrowser.prototype.stop = function() {
	this.browser.stop();
};
MachineTalkBrowser.prototype._handleServiceUp = function(service) {
	var txtRecord = service.txtRecord;
	if (!txtRecord) { return; }
	var uuid = txtRecord.uuid;
	var service = txtRecord.service;
	var dsn = txtRecord.dsn;
	if (!uuid || !service || !dsn) { return; }
	var machine = this.machines[uuid];
	if (!machine) {
		machine = this.machines[uuid] = {
			uuid: uuid,
			services: {}
		};
		this.emit('machineUp', machine);
	}
	machine.services[service] = dsn;
	this.emit('serviceUp', machine, service, dsn);
};
MachineTalkBrowser.prototype._handleServiceDown = function(service) {
	var txtRecord = service.txtRecord;
	if (!txtRecord) { return; }
	var uuid = txtRecord.uuid;
	var service = txtRecord.service;
	var dsn = txtRecord.dsn;
	if (!uuid || !service || !dsn) { return; }
	var machine = this.machines[uuid];
	if (!machine) { return; }
	if (!machine.services[service]) { return; }
	delete machine.services[service];
	this.emit('serviceDown', machine, service, dsn);
	if (_.isEmpty(machine.services)) {
		delete this.machines[uuid];
		this.emit('machineDown', machine);
	}
};

module.exports = MachineTalkBrowser;