# form-sequence

A rocaesque custom element to interactively transclude remote forms: Progressively enhance your multi page forms.

## Demo

Clone repo, then `npm install && npm run demo`. Browse to the url which gets displayed (usually http://localhost:3000)

## Usage

Wrap the starting point of your form with the form-sequence element. By applying the id of the wrapped anchor to the `capture` attribute, the click gets intercepted. Instead of changing to the next page, the page gets loaded in the background and the desired form gets transcluded here.

Have a look at the example:

    <form-sequence capture="goto-edit" form="edit-something-form" cancel="cancel-form">
      <a id="goto-edit" href="/something/edit">Edit Something</a>
    </form-sequence>

The remote form could look like this

    <form name="edit-something-form" id="edit-something-form" action="/something/edit" method="post">
      <input type="text" id="title" value="the title of that thing">
      <a id="cancel-form" href="/something">cancel</a>
      <input type="submit" value="save">
    </form>

### Attributes

- `capture`  
  Provide the id of the entry point element.

- `form`  
  The name of the form which is going to get transcluded.

- `cancel`  
  If the form has something like a cancel action to go back, you can put the id/name of that element here to be able to "undo" the transclusion.

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
