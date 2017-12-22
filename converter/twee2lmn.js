#!/usr/bin/env node

var program = require('commander');
var fs = require('fs-extra');
var DEFAULT_ENTRIES_REGEX = /^<<([^>]*)[>>][^<[]*/gm;
var DEFAULT_LINKS_REGEX = /^<<([^>]*)[>>][^<[]*/gm;
var entriesRegExp = DEFAULT_ENTRIES_REGEX;
var linksRegExp = DEFAULT_LINKS_REGEX;

program
    .version('0.1.0')
    .option('-e, --entriesRegExp <regex>', 'An RegExp to describe a valid entry. Will be created with flags "gm". Omit leading and ending /.')
    .option('-l, --linksRegExp <regex>', 'An RegExp to describe a valid link. Will be created with flags "gm". Omit leading and ending /.')
    .arguments('<inputfile>')
    .action(function (inputfile) {
        if (program["entriesRegExp"]) {
            entriesRegExp = new RegExp(program["entriesRegExp"], "gm");
        }
        if (program["linksRegExp"]) {
            linksRegExp = new RegExp(program["linksRegExp"], "gm");
        }
        fs.readFile(inputfile,"UTF-8"/*??*/).then(function(content){

            console.log(content);
        });
    });

program.parse(process.argv);





