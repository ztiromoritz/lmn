
# A collection of dialog tree experiments
Currently only the *lmn* style is implemented supported.

## Development
### Test
```bash
npm install
npm test                # run tests 
npm run test:watch      # run tests and re-run on code changes
npm run test:coverage   # genereate test coverage report. Html result can be found in ./coverage 
```
### Generated docs

## Concepts and ideas 

### lmn
Tiny dialog tree library. LMN stands for : 
Label, Message, Next,

Example dialog:
```json
{
  "dialog" : [
        ["Simple Message"],
        ["label1", "other message"],
        ["label2", "goto label1", "label1"],
        ["label3", "Where do you want to go next?",
            "end",
            [
                ["Answer 1", "label4"],
                ["Answer 2", "label5"],
                ["Answer 3", "???"]
            ]
        ],
        ["label4", "Hello"],
        ["label5", "asdf"],
        ["end", ""]
    ]
}
```
### lmno - idea/draft
Reimplementation of lmn with a more verbose json syntax:
Label, Message, Next, Options
```json
{
 "dialog": [
    {"m" : "Simple Message"},
    {"l" : "label1", "m": "other message"},
    {"l" : "label2", "m": "goto label1", "n": "label1" },
    {   "l": "label3", 
        "m" : "'Where do you want to go next?'",
        "n": "end",
        "o" : [
            {"m" :"Answer 1",  "n": "label4"},
            {"m" :"Answer 2",  "n": "label5"},
            {"m" :"Answer 3",  "n": "???"}
        ]
    },
    {"l" : "label4", "m": "other message"},
    {"l" : "label5", "m": "other message"},
    {"l" : "en", "m": ""}
 ]
}

```

### twee2lmn.js - idea/draft
Supports a subset of twee files and twine syntax
 - Title of the Passage will be the Label
Content of the Passage has to be of the form
```
::Foo
<<Mo "Some Text">>
<<Mo "More Text May be multiline">>
<<May "Answer">>
<<Mo "What is this?">>
<<May "This is an answer">>
[[Link]]
[[Option A:Link1]]
[[Option B:Link2]]
::Link
<<May "Foo">>
::Link1

```  
(First there is a Link free List of content elements. 
Those elements are grouped as Twine Macros <<Name "Text">>
Second there is a list of links with possible link label.
- The content elements describe a sequence of lmn messages. 
- The first link will be the default next link for the last lmn entry, iff there is no label in the link..
- All links with label will be the possible next options elements.

So the example above will be converted to:

```json
{
 "dialog" : [
    ["<<Mo \"Some Text\">>"],
    ["<<Mo>>More Text\nMay be multiline"],
    ["<<May>>Answer"],
    ["<<Mo>>What is this?"],
    ["ad4jksd","<<May>>This is an answer", 
        "Link",[
            ["",""]
        ]]
 ]
}
``` 


### lmnop - idea/draft

 * there are 'objects' that can be dragged and dropped onto another
 * 'objects' can be combinable objects as well as verbs, See Example.


A slightly bigger dialog tree library. LMNOP stands for: Label, Message, Next, Object, Path
```json
{
    "dialog": [
        ["simple message"],
        ["label1", "other message"],
        ["label2", "goto label1", "label1"],
        ["label3", "the garden", "end",
            ["apple", "basket", "ladder", "tree", "knife", "grapes"],
            [   
                ["leave","Leave the garden",  "label5"],
                ["ladder>tree", "you put the ladder to the tree"],
                ["apple>basket", "you put the apple in the basket"],
                ["apple+grapes", "you make fruit salad", "label4"]
            ]
        ],
        ["label4", "what do you want to do with the fruit salad?"],
        ["label5", "You have left the garden"],
        ["end", "bye,bye"]
    ]
}
```

Paths descriptions: [trigger, reaction message, nextNodeLabel]
 * trigger
  * "ladder"      - ladder can be clicked
  * "ladder>tree" - ladder can be dropped onto tree, but not vice versa
  * "apple+grapes" - apple can be dropped onto grapes and vice versa
 * reaction message: a simple string that will be displayed
 * nextNodeLabel: changes current node if this action is triggered. the transformations will be applied before to the objects in the old node. Empty string for no node change.

 Not TODOs in this version:
  * inventory
  * transformations
    * [trigger, reaction message, nextNodeLabel, !transformations!]
    * "" - empty string for noop
    * "apple->apple slices" - "apple" will be substituted with "apple slices"

#Links
[https://github.com/v21/tws-to-twee-converter](https://github.com/v21/tws-to-twee-converter)