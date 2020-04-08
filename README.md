<img align="left" style="margin: 6px" src="https://raw.githubusercontent.com/AgentCoop/react-guy-composer/master/docs/logo-peter-griffin.png" height="120" alt='React Guy Composer Logo' aria-label='' />

**React-Guy-Composer** is a library that allows you to manage state of your components using an event-driven approach.
Handle form data, and change state of nested components in an easy and predictable way.
<br><br><br>

## Overview
Every frontend developer is familiar with the HTML5 event model, every one of us heard of such things like _event
bubbling_, _event listeners_, _target element_ and so on. Fire an event, and it will propagate through the DOM hierarchy,
from the target element all the way up to the root one (in the case of event bubbling).

On the other hand, a React application is a hierarchy of React components. So, the idea behind the library is very
simple: having a hierarchy of components (the component tree), dispatch an event to the target component and propagate
it throught components in the component tree. And because any of the components may have event listeners, you can
easily change the state of the target component during the event propagation.
 