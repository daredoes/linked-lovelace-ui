# Dev Notes

## Template Walk

- Go through each dashboard
- Go through all collected views
- For each view, walk the object for any template keys or partial keys
- If a template key is found, extract it into a new object
- If a partial key is found, extract it into a new object
- When all views have been walked, report back the final collection of templates and partials
- Sort the partials and templates by priority
- Add each partial to the system, rendering it with the context of all known partials
- Add each template to the system, rendering it with the context of all known partials and templates
- Report back the final collection of templates and partials

## Render Walk

- Go through each dashboard
- Go through all collected views
- For each view, walk the object for any template keys
- If a template key is found, render it with the context of all known partials and templates as well as any parent context applied under the child context, and replace the whole card with the rendered template, return the card
- If the value is an object, iterate over the entries of the object and pass it to the walk function, and if a value comes back, replace the value in the object with the returned value, if any modifications occurred, return the modified object, else return undefined
- If the value is a string, number, boolean, or symbol, skip any modification on it and return undefined
- If the value is an array, iterate over it and pass it to the walk function, and if a value comes back, replace the value in the array with the returned value, if any modifications occurred, return the modified array, else return undefined
- If the value is undefined, skip any modification on it and return undefined
- When a view is finished being walked, it will return an object if modified or undefined if never modified
- When all views have been walked, report back the final collection of modified views
