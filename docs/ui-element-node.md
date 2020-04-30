## UIElement
A node representing UI interface.
```javascript
import {UIElement} from "@react-guy/composer";
...
    <UIElement {...elementProps}>
        {({ value, state, errors, dispatch }) => {
            return (
                <div />
            );
        }}
    </UIElement>
```

##### API reference

###### AbstractNode
* getDescendantsPath
* getAncestorsPath
* findByClass
* findByElementName
* getNextSibling
* getPrevSibling
* getChildNodes
* getRoot
* getParentNode
* getSiblings
* getNamespace
* addChildNode
* traverseTree
* getClass
* getEventListeners
* isStaticListenerDisabled
* removeEventListener
* addEventListener
* getName
* getType
* getId

##### UIElement
* getState
* setState()
```text
Returns current element's state.
```
