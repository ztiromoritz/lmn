(function (global) {
    var lmn = {};

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
    var OPTION_NEXT = STR+STR;

    var toStr = Object.prototype.toString;

    function isArray(a) {
        return toStr.call(a) === ARR;
    }

    function isString(s) {
        return toStr.call(s) === STR;
    }

    function isNumber(n) {
        return toStr.call(n) === NUM;
    }


    var dialogStore = Object.create(null);

    function commandType(command) {
        var result = "";
        for (var i = 0; i < command.length; i++) {
            result += toStr.call(command[i]);
        }
        return result;
    }

    function validateCommand(command, index) {
        var type = commandType(command);
        if (type == MESSAGE
            || type == LABEL_MESSAGE
            || type == LABEL_MESSAGE_NEXT
            || type == LABEL_MESSAGE_OPTIONS
            || type == LABEL_MESSAGE_NEXT_OPTIONS) {
            return;
        }
        throw ("Invalid Command [" +command + "] type ["+type+"] in ["+index+"]");
    }

    function validateOption(option, index, optionIndex){
        var type = commandType(option);
        if(type  == OPTION_NEXT)
            return;
        throw ("Invalid Option ["+option + "] type ["+type+"] in command ["+index+"] option ["+optionIndex+"]");
    }


    lmn.addDialog = function (name, data) {
        if (!data)
            throw 'Empty data';

        var commands = data['dialog'];

        if (!commands)
            throw 'No dialog in data';

        if (!isArray(commands)) {
            throw 'Dialog is not an array';

        }
        //First collect all labels
        var labels = Object.create(null);
        for (var i = 0; i < commands.length; i++) {
            var command = commands[i];
            validateCommand(command,i);
            var type = commandType(command);
            if (type != MESSAGE) {
                labels[command[0]] = i;
            }
        }
        //Wildcard to have unfinised dialogs
        labels["???"]=-1;

        //Then check for correct label use in next
        for (var i = 0; i < commands.length; i++) {
            var command = commands[i];
            var type = commandType(command);
            if (LABEL_MESSAGE_NEXT === type) {

                if (!labels[command[2]])
                    throw ("Unknown next in command " + i + "["+command+"]");

            } else if (LABEL_MESSAGE_OPTIONS === type) {

                for (var k = 0; k < command[2].length; k++) {
                    var option = command[2][k];
                    validateOption(option,i,k);
                    if(!labels[option[1]])
                        throw ("Unknown next in option [" + k + "] command ["+i+"] :"+option);
                }

            } else if (LABEL_MESSAGE_NEXT_OPTIONS === type) {

                if (!labels[command[2]])
                    throw ("Unknown next in command " + i + "["+command+"]");

                for (var k = 0; k < command[3].length; k++) {
                    var option = command[3][k];
                    validateOption(option,i,k);
                    if(!labels[option[1]])
                        throw ("Unknown next in option [" + k + "] command ["+i+"] :"+option);
                }
            }
        }


        dialogStore[name] = {
            commands: commands,
            labels: labels
        };


        console.log('Success');
    };

    /**
     * Creates a single instance of the dialog given by name.
     * @param name
     * @returns {{step: number, pendingOptions: null, usedOptions: {}, dialog: *, next: Function}}
     */
    lmn.startDialog = function (name) {
        if (!dialogStore[name])
            throw ('No such dialog exists: ' + name);

        return {
            step: 0,                // current step in command array
            pendingOptions: null,  // copy of the current array of option
            usedOptions: {},       // { 3 : {0:true,2:true}, 4: {0:true,5:true}}
            dialog: dialogStore[name], // static dialog
            /**
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
             * @param decision
             * @returns {*}
             */
            next: function (decision) {

                if (this.step >= this.dialog.commands.length)
                    return false;
                if (this.pendingOptions) {
                    if (arguments.length === 0)
                        return this.pendingOptions;
                    var label = this.pendingOptions.options[decision][1];
                    this.usedOptions[this.step] = this.usedOptions[this.step] || Object.create(null);
                    this.usedOptions[this.step][decision] = true;
                    this.step = this.dialog.labels[label];
                    this.pendingOptions = null;
                }
                if (this.step < 0)
                    return "UNFINISHED DIALOG";

                var command = this.dialog.commands[this.step];
                var type = commandType(command);

                if (MESSAGE === type) {
                    this.step++;
                    return command[0];

                } else if (LABEL_MESSAGE === type) {
                    this.step++;
                    return command[1];

                } else if (LABEL_MESSAGE_NEXT === type) {
                    this.step = this.dialog.labels[command[2]];
                    return command[1];

                } else if (LABEL_MESSAGE_OPTIONS === type) {
                    this.pendingOptions = {
                        question: command[1],
                        options: command[2]
                    };
                    return this.pendingOptions;

                } else if (LABEL_MESSAGE_NEXT_OPTIONS === type) {
                    var usedOptionsForStep = this.usedOptions[this.step] || EMPTY_SET;
                    var pendingOptions = [];
                    for (var i = 0; i < command[3].length; i++) {
                        if (!usedOptionsForStep[i]) {
                            pendingOptions[i] = (command[3][i]);
                        }
                    }
                    if (pendingOptions.length > 0) {
                        this.pendingOptions = {
                            question: command[1],
                            options: pendingOptions
                        };
                        return this.pendingOptions;
                    } else {
                        //No options left
                        this.step = this.dialog.labels[command[2]];
                        return this.next();
                    }
                }
            }
        }

    };

    lmn.listDialogs = function(){
        return Object.getOwnPropertyNames(dialogStore);
    };


    global['lmn'] = lmn;

})(this);