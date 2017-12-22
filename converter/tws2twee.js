#!/usr/bin/env node
var jpickle = require('jpickle');
var fs = require('fs-extra');
const PyMarshal = require('py-marshal');
const Pickle = require('chromium-pickle-js');

var args = process.argv.slice(2);
if (args.length > 0) {
    fs.readFile(args[0])
        .then(function (result) {
            return PyMarshal.readFromBuffer(result);
        })
        .then(function (data) {
            console.log(data);
        })
        .catch(function(err){
            console.error(err);
        });
}


