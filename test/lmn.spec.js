"use strict";
/* globals describe, it */
const {expect} = require("chai");
const {DialogStore,Step} = require("../src/lmn.js");

const ALLOWED = require("./allowed.lmn.json");

/* Test Data */

describe("DialogStore", () => {
    describe("Basics", () => {

        it("Ensure Interface", function () {
            var store = new DialogStore();
            expect(store.startDialog).to.be.a('function');
            expect(store.addDialog).to.be.a('function');
        });

        it("Minimal dialog", () => {
            // given
            var store = new DialogStore();
            const data = {dialog: []};
            // when
            store.addDialog("foo", data);
            //expect no error to be thrown;
        });


        it("Dialog can be found by name", () => {
            // given
            var store = new DialogStore();
            const data = {dialog: []};
            const name = "myDialog";
            // when
            store.addDialog(name, data);
            const dialog = store.startDialog(name);

            // then
            expect(dialog).to.be.an('object');
        });
    });

    describe("Parse", () => {
        it("Allowed entry styles", () => {
            // given
            var store = new DialogStore();
            const name = "foo";

            // when
            store.addDialog(name, ALLOWED);
        });

        it("Invalid data. No parameter", () => {
            var store = new DialogStore();
            expect(() => store.addDialog("foo")).to.throw(/INVALID_DATA/);
        });

        it("Invalid data. No dialog property.", () => {
            var store = new DialogStore();
            expect(() => store.addDialog("foo", {})).to.throw(/INVALID_DATA/);
        });

        it("Invalid data. Not an array", () => {
            var store = new DialogStore();
            expect(() => store.addDialog("foo", {dialog: "bar"})).to.throw(/INVALID_DATA/);
        });

        it("Invalid Command", () => {
            var store = new DialogStore();
            expect(() => store.addDialog("foo", {dialog: [['A', 'message', 'next', 'foo']]})).to.throw(/INVALID_COMMAND/);
        });

        it("Invalid Options", () => {
            var store = new DialogStore();
            expect(() => store.addDialog("foo", {dialog: [['A', 'message', 'A', [['foo']]]]})).to.throw(/INVALID_OPTION/);
        });

        it("Next value with no matching error. LABEL_MESSAGE_>NEXT<", () => {
            var store = new DialogStore();
            expect(() => store.addDialog("foo", {dialog: [['A', 'message', 'next', []]]})).to.throw(/NO_LABEL_FOR_NEXT/);
        });

        it("Next value with no matching error. LABEL_MESSAGE_>NEXT<_OPTIONS", () => {
            var store = new DialogStore();
            expect(() => store.addDialog("foo", {dialog: [['A', 'message', 'next']]})).to.throw(/NO_LABEL_FOR_NEXT/);
        });

        it("Next value with no matching error. MESSAGE_>OPTIONS<", () => {
            var store = new DialogStore();
            expect(() => store.addDialog("foo", {dialog: [['message', [['foo', 'B']]]]})).to.throw(/NO_LABEL_FOR_NEXT/);
        });

        it("Next value with no matching error. LABEL_MESSAGE_NEXT_>OPTIONS<", () => {
            var store = new DialogStore();
            expect(() => store.addDialog("foo", {dialog: [['A', 'message', 'A', [['foo', 'B']]]]})).to.throw(/NO_LABEL_FOR_NEXT/);
        });

        it("Next value with no matching error. LABEL_MESSAGE_>OPTIONS<", () => {
            var store = new DialogStore();
            expect(() => store.addDialog("foo", {dialog: [['A', 'message', [['foo', 'B']]]]})).to.throw(/NO_LABEL_FOR_NEXT/);
        });

        it("Label collision/not unique", () => {
            // given
            var store = new DialogStore();
            const data = {dialog: [['labelA', 'message'], ['labelA', 'message']]};
            // when
            expect(() => store.addDialog("foo", data)).to.throw(/DUPLICATED_LABEL/);
        });
    });

    describe("Dialog instance.", () => {

        it("Ensure Interface", () => {
            // given
            var store = new DialogStore();
            const data = {dialog: []};
            const name = "myDialog";
            // when
            store.addDialog(name, data);
            const dialog = store.startDialog(name);
            // then
            expect(dialog.next).to.be.a('function');
        });

        it("No dialog.", () => {
            var store = new DialogStore();
            expect(() => store.startDialog("foo")).to.throw(/NO_SUCH_DIALOG/);
        });

        it("Simple sequence", () => {
            // given
            var store = new DialogStore();
            const data = {
                dialog: [
                    ['FOO'],
                    ['BAR'],
                    ['BATZ']
                ]
            };
            const name = "myDialog";
            store.addDialog(name, data);
            // when
            let dialog = store.startDialog(name);
            // then
            let step0 = dialog.next();
            expect(step0.getType()).is.equal(Step.Type.MESSAGE);
            expect(step0.getText()).is.equal('FOO');

            let step1 = dialog.next();
            expect(step1.getType()).is.equal(Step.Type.MESSAGE);
            expect(step1.getText()).is.equal('BAR');

            let step2 = dialog.next();
            expect(step2.getType()).is.equal(Step.Type.MESSAGE);
            expect(step2.getText()).is.equal('BATZ');

            let step3 = dialog.next();
            expect(step3.getType()).is.equal(Step.Type.END);

        });

        it("Simple sequence with labels", () => {
            // given
            var store = new DialogStore();
            const data = {
                dialog: [
                    ['A', 'FOO'],
                    ['B', 'BAR'],
                    ['C', 'BATZ']
                ]
            };
            const name = "myDialog";
            store.addDialog(name, data);
            // when
            let dialog = store.startDialog(name);
            // then
            let step0 = dialog.next();
            expect(step0.getType()).is.equal(Step.Type.MESSAGE);
            expect(step0.getText()).is.equal('FOO');

            let step1 = dialog.next();
            expect(step1.getType()).is.equal(Step.Type.MESSAGE);
            expect(step1.getText()).is.equal('BAR');

            let step2 = dialog.next();
            expect(step2.getType()).is.equal(Step.Type.MESSAGE);
            expect(step2.getText()).is.equal('BATZ');

            let step3 = dialog.next();
            expect(step3.getType()).is.equal(Step.Type.END);
        });


        it("Jump over", () => {
            // given
            var store = new DialogStore();
            const data = {
                dialog: [
                    ['A', 'FOO', 'C'],
                    ['B', 'BAR'],
                    ['C', 'BATZ']
                ]
            };
            const name = "myDialog";
            store.addDialog(name, data);
            // when
            let dialog = store.startDialog(name);
            // then
            let step0 = dialog.next();
            expect(step0.getType()).is.equal(Step.Type.MESSAGE);
            expect(step0.getText()).is.equal('FOO');

            let step1 = dialog.next();
            expect(step1.getType()).is.equal(Step.Type.MESSAGE);
            expect(step1.getText()).is.equal('BATZ');

            let step2 = dialog.next();
            expect(step2.getType()).is.equal(Step.Type.END);
        });

        it("Unfinished ", () => {
            // given
            var store = new DialogStore();
            const data = {
                dialog: [
                    ['A', 'FOO', '???']
                ]
            };
            const name = "myDialog";
            store.addDialog(name, data);
            // when
            let dialog = store.startDialog(name);
            // then
            let step0 = dialog.next();
            expect(step0.getType()).is.equal(Step.Type.MESSAGE);
            expect(step0.getText()).is.equal('FOO');

            let step1 = dialog.next();
            expect(step1.getType()).is.equal(Step.Type.UNFINSHED_DIALOG);
        });


        it("Select options", () => {
            // given
            var store = new DialogStore();
            const data = {
                dialog: [
                    ['A', 'FOO', [
                        ['Goto B', 'B'],
                        ['Goto C', 'C'],
                    ]],
                    ['B', 'BAR'],
                    ['C', 'BATZ']
                ]
            };
            const name = "myDialog";
            store.addDialog(name, data);
            // when
            let dialog = store.startDialog(name);
            // then

            let step0 = dialog.next();
            expect(step0.getType()).is.equal(Step.Type.QUESTION);
            expect(step0.getText()).is.equal('FOO');
            expect(step0.getAvaliableOptions()).is.deep.equal([
                ['Goto B', 'B', 0],
                ['Goto C', 'C', 1]
            ]);

            let step1 = dialog.next(0);
            expect(step1.getType()).is.equal(Step.Type.MESSAGE);
            expect(step1.getText()).is.equal('BAR');

            let step2 = dialog.next();
            expect(step2.getType()).is.equal(Step.Type.MESSAGE);
            expect(step2.getText()).is.equal('BATZ');

        });

        it("Select options, missing argument.", () => {
            // given
            var store = new DialogStore();
            const data = {
                dialog: [
                    ['A', 'FOO', [
                        ['Goto B', 'B'],
                        ['Goto C', 'C'],
                    ]],
                    ['B', 'BAR'],
                    ['C', 'BATZ']
                ]
            };
            const name = "myDialog";
            store.addDialog(name, data);
            // when
            let dialog = store.startDialog(name);
            // then
            expect(dialog.next().getType()).is.deep.equal(Step.Type.QUESTION);
            expect(dialog.next().getType()).is.deep.equal(Step.Type.QUESTION); //

        });

        it("Select options, with next.", () => {
            // given
            var store = new DialogStore();
            const data = {
                dialog: [
                    ['A', 'FOO', 'END',[
                        ['Goto B', 'B'],
                        ['Goto C', 'C']
                    ]],
                    ['B', 'BAR',  'A'],
                    ['C', 'BATZ', 'A'],
                    ['END','BYE BYE!']
                ]
            };
            const name = "myDialog";
            store.addDialog(name, data);
            // when
            let dialog = store.startDialog(name);
            // then

            let step0 = dialog.next();
            expect(step0.getType()).is.equal(Step.Type.QUESTION);
            expect(step0.getText()).is.equal('FOO');
            expect(step0.getAvaliableOptions()).is.deep.equal([
                ['Goto B', 'B', 0],
                ['Goto C', 'C', 1]
            ]);


            expect(dialog.next(0).getText()).is.equal('BAR');
            let step2 = dialog.next();
            expect(step2.getType()).is.equal(Step.Type.QUESTION);
            expect(step2.getText()).is.equal('FOO');
            expect(step2.getAvaliableOptions()).is.deep.equal([
                ['Goto C', 'C', 1]
            ]);
            expect(dialog.next(1).getText()).is.equal('BATZ');
            expect(dialog.next().getText()).is.equal('BYE BYE!');

        });


        it("List dialogs.", () => {
            // given
            var store = new DialogStore();
            const data = {
                dialog: [["hello"]]
            };
            const name = "myDialog";
            store.addDialog(name, data);
            // when
            const result = store.listDialogs();
            // then
            expect(result).to.be.deep.equal(["myDialog"]);
        });
    });


});