## Collections of dialog tree experiments

### lmn
Tiny dialog tree library. LMN stands for : Label, Message, Next.

Example dialog:
```javascript
{
    "dialog": [
        ['Simple Message'],
        ['label1', 'other message'],
        ['label2', 'goto label1', 'label1']
        ['label3', 'Where do you want to go next?',
            'end',
            [
                ['Answer 1', 'label4'],
                ['Answer 2', 'label5'],
                ['Answer 3', '???']
            ]
        ],
        ['label4', 'Hello'],
        ['label5', 'asdf'],
        ['end', '']
    ]
}
```


### lmnop - idea/draft

 * there are 'objects' that can be dragged and dropped onto another
 * 'objects' can be combinable objects as well as verbs, See Example.


A slightly bigger dialog tree library. LMNOP stands for: Label, Message, Next, Object, Path
```javascript
{
    "dialog" : [
        ['simple message'],
        ['label1', 'other message'],
        ['label2', 'goto label1', 'label1'],
        ['label3', 'the garden', 'end'
            ['apple', 'basket', 'ladder', 'tree', 'knife', 'grapes'],
            [   
                ['leave','Leave the garden',  'label5']
                ['ladder>tree', 'you put the ladder to the tree'],
                ['apple>basket', 'you put the apple in the basket'],
                ['apple+grapes', 'you make fruit salad', 'label4']
            ]
        ],
        ['label4', 'what do you want to do with the fruit salad?'],
        ['label5', 'You have left the garden'],
        ['end', 'bye,bye']
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
