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

    //Question with label and options
    //If you return to this question, all options will be available again
    var LABEL_MESSAGE_OPTIONS = STR + STR + ARR;

    // Question with label, options and a default next.
    // Options will be available only once.
    // If you return to this questions, you only see remaining options.
    // If all options are taken. The question will not be presented again
    // and the dialog goes direct to the command given in next.
    var LABEL_MESSAGE_NEXT_OPTIONS = STR + STR + STR + ARR;

    //
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
            || type === LABEL_MESSAGE_OPTIONS
            || type === LABEL_MESSAGE_NEXT_OPTIONS) {
            return type;
        }
        throw new Error(ERROR_CODE.INVALID_COMMAND + ": Invalid Command [" + command + "] type [" + type + "] in [" + index + "]");
    }

    function hasLabel(type) {
        return (type != MESSAGE && type !== MESSAGE_OPTIONS);
    }

    function validateCommandNext(labels, label, command, commandIndex) {
        if (!isNumber(labels[label])) {
            throw new Error(ERROR_CODE.NO_LABEL_FOR_NEXT + ": No label found for next value in command " + commandIndex + " [" + JSON.stringify(command) + "]");
        }
    }

    function validateOptionType(option, index, optionIndex) {
        var type = commandType(option);
        if (type == OPTION_NEXT)
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
     *
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
        //Wildcard to have unfinised dialogs
        labels["???"] = -1;

        //Then check for correct label use in next
        commands.forEach(function (command, i) {
            var label = null;
            var options = [];
            var type = commandType(command);
            if (LABEL_MESSAGE_NEXT === type) {
                label = command[2];
            } else if (MESSAGE_OPTIONS === type) {
                options = command[1];
            } else if (LABEL_MESSAGE_OPTIONS === type) {
                options = command[2];
            } else if (LABEL_MESSAGE_NEXT_OPTIONS === type) {
                label = command[2];
                options = command[3];
            }
            if (label) validateCommandNext(labels, label, command, i);
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
     *
     * @param dialog
     * @constructor
     */
    var DialogInstance = function (dialog) {
        this.step = 0;                  // current step in command array
        this.pendingOptions = null;     // copy of the current array of option
        this.usedOptions = {};          // { 3 : {0:true,2:true}, 4: {0:true,5:true}}
        this.dialog = dialog;           // static dialog
    };

    /**
     *
     * Main function to interact with dialog.
     * Subsequent calls to next alters the state of the dialog.
     *
     * TODO: return value should be a wrapped in an Object
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
     *
     * @param {String} [decision]
     * @returns {boolean|string|Object}
     */
    DialogInstance.prototype.next = function (decision) {

        if (this.pendingOptions) {
            if (arguments.length === 0)
                return this.pendingOptions;
            var label = this.pendingOptions.options[decision][1];
            this.usedOptions[this.step] = this.usedOptions[this.step] || Object.create(null);
            this.usedOptions[this.step][decision] = true;
            this.step = this.dialog.labels[label];
            this.pendingOptions = null;
        }

        if (this.step >= this.dialog.commands.length){
            return new Step(Step.Type.END);
        }else if (this.step === -1){
            return new Step(Step.Type.UNFINSHED_DIALOG);
        }

        var command = this.dialog.commands[this.step];
        var type = commandType(command);

        if (MESSAGE === type) {
            this.step++;
            return new Step(Step.Type.MESSAGE, command[0]);
        } else if (LABEL_MESSAGE === type) {
            this.step++;
            return new Step(Step.Type.MESSAGE, command[1]);
        } else if (LABEL_MESSAGE_NEXT === type) {
            this.step = this.dialog.labels[command[2]];
            return new Step(Step.Type.MESSAGE, command[1]);
        } else if (LABEL_MESSAGE_OPTIONS === type) {
            this.pendingOptions = new Step(Step.Type.QUESTION, command[1], command[2]);
            return this.pendingOptions;
        } else if (LABEL_MESSAGE_NEXT_OPTIONS === type) {
            var usedOptionsForStep = this.usedOptions[this.step] || EMPTY_SET;
            var pending = [];
            var options = command[3];
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
                this.pendingOptions = new Step(Step.Type.QUESTION, command[1], pending);
                return this.pendingOptions;
            } else {
                //No options left
                this.step = this.dialog.labels[command[2]];
                return this.next();
            }
        }
    };


    /**
     *
     * @param type
     * @param text
     * @param options
     * @constructor
     */
    var Step = function (type, text, options) {
        this.type = type;
        this.text = text;
        this.options = options;
    };

    /**
     *
     * @type {{END: number, MESSAGE: number, QUESTION: number, UNFINSHED_DIALOG: number}}
     */
    Step.Type = {
        "END": 0,
        "MESSAGE": 1,
        "QUESTION": 2,
        "UNFINSHED_DIALOG": 3
    };

    /**
     *
     * @returns {*}
     */
    Step.prototype.getType = function () {
        return this.type;
    };

    /**
     *
     * @returns {*}
     */
    Step.prototype.getText = function () {
        return this.text;
    };

    /**
     *
     */
    Step.prototype.getAvaliableOptions = function () {
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
     *
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