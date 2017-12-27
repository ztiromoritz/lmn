(function (root, factory) {
    /*global module, define, define*/
    /* istanbul ignore next */
    if (typeof exports === 'object') {
        // COMMON-JS
        module.exports = factory();
    } else if (typeof define === 'function' && define['amd']) {
        // Asynchronous Module Definition AMD
        define([], factory);
    } else {
        //GLOBAL (e.g. browser)
        root['lmn'] = factory();
    }
}(this, function () {
    'use strict';

    /**
     *
     * @constructor
     */
    var DialogStore = function () {
        this.dialogs = Object.create(null);
    };

    var FUNC = "[object Function]";
    var OBJ = "[object Object]";
    var ARR = "[object Array]";
    var NUM = "[object Number]";
    var STR = "[object String]";
    var NULL = "[object Null]";
    var UNDEF = "[object Undefined]";

    var EMPTY_SET = Object.create(null);

    //Simple message, next step is the next command in array.
    var MESSAGE = STR;

    //Message with label, next step is the next command in array.
    var LABEL_MESSAGE = STR + STR;

    //Message with label, next step is given.
    var LABEL_MESSAGE_NEXT = STR + STR + STR;

    // Questions with options
    //If you return to this question, all options will be available again
    var MESSAGE_OPTIONS = STR + ARR;

    // Question with options and a default next.
    // Options will be available only once.
    // If you return to this questions, you only see remaining options.
    // If all options are taken. The question will not be presented again
    // and the dialog goes direct to the command given in next.
    var MESSAGE_OPTIONS_NEXT = STR + ARR + STR;

    //Question with label and options
    //If you return to this question, all options will be available again
    var LABEL_MESSAGE_OPTIONS = STR + STR + ARR;

    // Question with label, options and a default next.
    // Options will be available only once.
    // If you return to this questions, you only see remaining options.
    // If all options are taken. The question will not be presented again
    // and the dialog goes direct to the command given in next.
    var LABEL_MESSAGE_OPTIONS_NEXT = STR + STR + ARR + STR ;


    // Type of option entry in options array
    var OPTION_NEXT = STR + STR;

    var ERROR_CODE = {
        "INVALID_DATA": "INVALID_DATA",
        "INVALID_COMMAND": "INVALID_COMMAND",
        "INVALID_OPTION": "INVALID_OPTION",
        "NO_LABEL_FOR_NEXT": "NO_LABEL_FOR_NEXT",
        "DUPLICATED_LABEL": "DUPLICATED_LABEL",
        "NO_SUCH_DIALOG": "NO_SUCH_DIALOG"
    };


    var toStr = Object.prototype.toString;

    function isArray(a) {
        return toStr.call(a) === ARR;
    }

    function isNumber(n) {
        return toStr.call(n) === NUM;
    }


    function commandType(command) {
        var result = "";
        for (var i = 0; i < command.length; i++) {
            result += toStr.call(command[i]);
        }
        return result;
    }

    function validateData(data) {
        if (!data) {
            throw new Error(ERROR_CODE.INVALID_DATA + ': Empty data');
        }
        var commands = data['dialog'];
        if (!commands) {
            throw new Error(ERROR_CODE.INVALID_DATA + ': No dialog in data');
        }
        if (!isArray(commands)) {
            throw new Error(ERROR_CODE.INVALID_DATA + ': Dialog is not an array');
        }
        return commands;
    }

    function validateCommandType(command, index) {
        var type = commandType(command);
        if (type === MESSAGE
            || type === LABEL_MESSAGE
            || type === LABEL_MESSAGE_NEXT
            || type === MESSAGE_OPTIONS
            || type === MESSAGE_OPTIONS_NEXT
            || type === LABEL_MESSAGE_OPTIONS
            || type === LABEL_MESSAGE_OPTIONS_NEXT) {
            return type;
        }
        throw new Error(ERROR_CODE.INVALID_COMMAND + ": Invalid Command [" + command + "] type [" + type + "] in [" + index + "]");
    }

    function hasLabel(type) {
        return (type !== MESSAGE && type !== MESSAGE_OPTIONS && type !== MESSAGE_OPTIONS_NEXT);
    }

    function validateCommandNext(labels, label, command, commandIndex) {
        if (!isNumber(labels[label])) {
            throw new Error(ERROR_CODE.NO_LABEL_FOR_NEXT + ": No label found for next value in command " + commandIndex + " [" + JSON.stringify(command) + "]");
        }
    }

    function validateOptionType(option, index, optionIndex) {
        var type = commandType(option);
        if (type === OPTION_NEXT)
            return;
        throw new Error(ERROR_CODE.INVALID_OPTION + ": Invalid Option [" + option + "] type [" + type + "] in command [" + index + "] option [" + optionIndex + "]");
    }

    function validateOptionNext(labels, option, commandIndex, optionIndex) {
        if (!isNumber(labels[option[1]])) {
            throw new Error(ERROR_CODE.NO_LABEL_FOR_NEXT + ": No label found for next value in option [" + optionIndex + "] command [" + commandIndex + "] :" + JSON.stringify(option));
        }
    }

    function validateDuplicateLabel(labels, label, command, commandIndex) {
        if (isNumber(labels[label])) {
            throw new Error(ERROR_CODE.DUPLICATED_LABEL + ": Duplicated label [" + label + "] in command " + commandIndex + "  [" + JSON.stringify(command) + "]");
        }
    }

    /**
     * @memberof DialogStore#
     * @param name
     * @param data
     */
    DialogStore.prototype.addDialog = function (name, data) {
        var commands = validateData(data);

        //First collect all labels
        var labels = Object.create(null);
        commands.forEach(function (command, i) {
            var type = validateCommandType(command, i);
            if (hasLabel(type)) {
                var label = command[0];
                validateDuplicateLabel(labels, label, command, i);
                labels[label] = i;
            }
        });
        //Wildcard to have unfinished dialogs
        labels["???"] = -1;

        //Check for correct label use in next
        //Check options
        commands.forEach(function (command, i) {
            var next = null;
            var options = [];
            var type = commandType(command);
            if (LABEL_MESSAGE_NEXT === type) {
                next = command[2];
            } else if (MESSAGE_OPTIONS === type) {
                options = command[1];
            } else if (MESSAGE_OPTIONS_NEXT === type) {
                next = command[2];
                options = command[1];
            } else if (LABEL_MESSAGE_OPTIONS === type) {
                options = command[2];
            } else if (LABEL_MESSAGE_OPTIONS_NEXT === type) {
                next = command[3];
                options = command[2];
            }
            if (next) validateCommandNext(labels, next, command, i);
            options.forEach(function (option, k) {
                validateOptionType(option, i, k);
                validateOptionNext(labels, option, i, k);
            });
        });

        this.dialogs[name] = {
            commands: commands,
            labels: labels
        };

    };

    function cloneDialog(dialog) {
        return JSON.parse(JSON.stringify(dialog));
    }

    /**
     * @private
     * @param dialog
     * @constructor
     */
    var DialogInstance = function (dialog) {
        this.currentStep = 0;                  // current step in command array
        this.pendingOptions = null;     // copy of the current array of option
        this.usedOptions = {};          // { 3 : {0:true,2:true}, 4: {0:true,5:true}}
        this.dialog = dialog;           // static dialog
    };

    /**
     *
     * Main function to interact with dialog.
     * Subsequent calls to next alters the state of the dialog.
     *
     * Next gives:
     *   1. false - if dialog is over
     *   2. a string - as next sentence from the character you talk to
     *   3. an object - {
     *      question,  //a question text
     *      [options], //array of options
     *   }
     *   In case 3 you can decide an answer by giving the index of option you want to choose.
     *   I you give no decision, the state will not be altered and you receive the question again.
     *
     *   Be careful, the [options] array can have undefined entries to keep the selection order.
     * @memberof DialogInstance#
     * @param {Number} [decision]
     * @returns {Step}
     */
    DialogInstance.prototype.next = function (decision) {

        if (this.pendingOptions) {
            if (arguments.length === 0)
                return this.pendingOptions;
            var label = this.pendingOptions.options[decision][1];
            this.usedOptions[this.currentStep] = this.usedOptions[this.currentStep] || Object.create(null);
            this.usedOptions[this.currentStep][decision] = true;
            this.currentStep = this.dialog.labels[label];
            this.pendingOptions = null;
        }

        if (this.currentStep >= this.dialog.commands.length){
            return new Step(Step.Type.END);
        }else if (this.currentStep === -1){
            return new Step(Step.Type.UNFINSHED_DIALOG);
        }

        var command = this.dialog.commands[this.currentStep];
        var type = commandType(command);

        if (MESSAGE === type) {
            this.currentStep++;
            return new Step(Step.Type.MESSAGE, command[0]);
        } else if (LABEL_MESSAGE === type) {
            this.currentStep++;
            return new Step(Step.Type.MESSAGE, command[1]);
        } else if (LABEL_MESSAGE_NEXT === type) {
            this.currentStep = this.dialog.labels[command[2]];
            return new Step(Step.Type.MESSAGE, command[1]);
        } else if (LABEL_MESSAGE_OPTIONS === type) {
            this.pendingOptions = new Step(Step.Type.QUESTION, command[1], command[2]);
            return this.pendingOptions;
        } else if (MESSAGE_OPTIONS === type) {
            this.pendingOptions = new Step(Step.Type.QUESTION, command[0], command[1]);
            return this.pendingOptions;
        } else if (LABEL_MESSAGE_OPTIONS_NEXT === type || MESSAGE_OPTIONS_NEXT === type) {
            var message, options, next;
            if(LABEL_MESSAGE_OPTIONS_NEXT === type ){
                message = command[1];
                options = command[2];
                next = command[3];
            }
            if(MESSAGE_OPTIONS_NEXT === type){
                message = command[0];
                options = command[1];
                next = command[2];
            }

            var usedOptionsForStep = this.usedOptions[this.currentStep] || EMPTY_SET;
            var pending = [];

            for (var i = 0; i < options.length; i++) {
                if (!usedOptionsForStep[i]) {
                    pending[i] = (options[i]);
                } else {
                    pending[i] = false;
                }
            }
            var pendingCount = pending.reduce(function (prev, curr) {
                return (curr) ? prev + 1 : prev;
            }, 0);
            if (pendingCount > 0) {
                this.pendingOptions = new Step(Step.Type.QUESTION, message, pending);
                return this.pendingOptions;
            } else {
                //No options left
                this.currentStep = this.dialog.labels[next];
                return this.next();
            }
        }
    };


    /**
     *
     * @param {Number} type
     * @param {string} [content]
     * @param {array} [options]
     * @constructor
     */
    var Step = function (type, content, options) {
        this.type = type;
        this.content = content;
        this.options = options;
    };

    /**
     * @memberof Step
     * @type {{END: number, MESSAGE: number, QUESTION: number, UNFINISHED_DIALOG: number}}
     */
    Step.Type = {
        "END": 0,
        "MESSAGE": 1,
        "QUESTION": 2,
        "UNFINISHED_DIALOG": 3
    };

    /**
     * @memberof Step#
     * @returns {*}
     */
    Step.prototype.getType = function () {
        return this.type;
    };

    /**
     * @memberof Step#
     * @returns {string}
     */
    Step.prototype.getContent = function () {
        return this.content;
    };

    /**
     * @memberof Step#
     */
    Step.prototype.getAvailableOptions = function () {
        return this.options
            .map(function (entry, index) {
                if (entry) {
                    return entry.slice().concat(index);
                } else {
                    return null;
                }
            })
            .filter(function (entry) {
                return !!entry;
            });
    };

    /**
     * Creates a single instance of the dialog given by name.
     * @memberof DialogStore#
     * @param name
     * @returns {DialogInstance}
     */
    DialogStore.prototype.startDialog = function (name) {
        if (!this.dialogs[name]) {
            throw new Error(ERROR_CODE.NO_SUCH_DIALOG + ': No such dialog exists: ' + name);
        }
        var dialog = cloneDialog(this.dialogs[name]);
        return new DialogInstance(dialog);
    };

    /**
     * @memberof DialogStore#
     * @returns {string[]}
     */
    DialogStore.prototype.listDialogs = function () {
        return Object.getOwnPropertyNames(this.dialogs);
    };

    return {
        Step : Step,
        DialogStore: DialogStore,
        ERROR_CODE: ERROR_CODE
    };
}))
;