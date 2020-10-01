# form-sequence

A rocaesque custom element to interactively transclude remote forms: Progressively enhance your multi-page-multi-step-forms.

<!-- TOC -->

- [form-sequence](#form-sequence)
    - [Demo](#demo)
    - [Usage](#usage)
        - [Basics](#basics)
        - [Attributes](#attributes)
        - [Events](#events)
        - [Methods](#methods)
        - [Styling Hints](#styling-hints)

<!-- /TOC -->

## Demo

Clone repo, then `npm install && npm run demo`. Browse to the url which gets displayed (usually http://localhost:3000)

## Usage

### Basics

1. Set the capture attribute
2. Set the form attribute
3. Listen to the return event and decide what to do finally

1, 2 - Wrap the starting point of your form with the form-sequence element: Apply the id of the wrapped anchor to the `capture` attribute so the click gets intercepted. Instead of changing to the next page, the page gets loaded in the background and the desired form gets transcluded here.

Example:

    <form-sequence capture="goto-edit" form="edit-something-form" cancel="cancel-form">
      <a id="goto-edit" href="/something/edit">Edit Something</a>
    </form-sequence>

The remote form could look like this

    <form name="edit-something-form" id="edit-something-form" action="/something/edit" method="post">
      <input type="text" id="title" value="the title of that thing">
      <a id="cancel-form" href="/something">cancel</a>
      <input type="submit" value="save">
    </form>

3 - You will most probably need to listen to the return event that gets fired after the last step. It will provide the response object as well as the response url object.

    document.querySelector("form-sequence").addEventListener("return", e => {
      // reload page to reflect eventual state change
      window.location.href = e.detail.url.href
    })

### Attributes

- `capture`  
  Provide the id of the entry point element.

- `form`  
  The name of the form which is going to get transcluded.

- `cancel`  
  If the form has something like a cancel action to go back, you can put the id/name of that element here to be able to "undo" the transclusion.

### Events

You can listen to some events which get fired during the process cycle: 

- `return`: Called when the process finishes.  
  __The crucial one.__ You most likely need to listen to this event to handle the final step of your form process. It provides the response object as well as the response url object in the event details.

- `done`: Called after each step.  
  No details provided.

- `success`: Called after each successful step.  
  No details provided.
  
- `error`: Called when an error occurs.  
  No details provided.

### Methods

Some methods of the element might be useful:

- `close`: Close/reset this form-sequence element.

- `closeAll`: Close/reset all form-sequence elements of that page.

### Styling Hints

After the form has been transcluded, the markup in the form-sequence element will look like this:

    <form-sequence capture="goto-edit" form="edit-something-form" cancel="cancel-form">
      <div role="heading">Eit Something</div>
      <div origin>
        <a id="goto-edit" href="/something/edit">Edit Something</a>
      </div>
      <div remote>
        ... your remote form
      </div>
    </form-sequence>

Have a look into `demo/style.css`. There you will find style definitions, some of which you'll likely want to apply to your app:

    // Hide the (retained) entry point element
    form-sequence [origin] {
      display: none;
    }

    // style the inserted heading element
    form-sequence [role="heading"] { ... }

    // clearfix, to be sure
    form-sequence::after {
      display: block;
      content: "";
      clear: both;
    }
