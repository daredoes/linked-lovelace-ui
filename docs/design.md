# Design Notes

The following are some notes on what I want to implement.

A user should need to add a card of `custom:templates-status` to use this feature. This card will do the bulk of the business logic.

When loaded, the card should do nothing. It should have a "Load" button, and a "Help" button. Pressing help should open up the docs.

When load is pressed, we begin our data collection process. This involves hitting a websocket to get knowledge of every dashboard that exists, and then hitting a websocket to get all the views/cards/details that exist in those dashboards.

Once we know all of the views and cards, we should identify/shortlink all of the available partials, templates, and usages.

## How this works

The project is installed as a Javascript Resource that is first loaded when a user sees a dashboard. In essence, it shadows the calls made when editing a raw dashboard configuration, or editing a card in the dashboard - which uses the same calls.

We wait for a user to create a card that contains our Template Controller. We'll wait for user interaction to hit "Load Data" before we collect the information we need. This is to be gentle on the server, as we don't want to make these calls every time the card is visible.

To collect the information we need, we make Websocket calls on behalf of the user. First, we ask for every dashboard that exists. Then, ask for the views and cards located on each dashboard.

Once we have all the dashboards, views, and cards, we begin combing through them for templates and partials. Order becomes very important here.

First we find all of our partials, which should have a key, a template, and an optional priority. Then we do the same with our templates.

Since the key has to be unique, we use the priority to decide which template/partial gets saved when there is a conflict in keys. The priority works so that the higher priority overwrites the lower priority.

Partials and templating is handled by Eta JS. While the data we have retrieved is fresh and accurate, it can be come stale at any moment.

Now that we know all of our partials and templates, we can comb through all of the cards to locate which ones we plan to replace. This is an expensive recursive operation. It should have an endpoint, since the dashboards contain a finite number of cards. To help ensure this endpoint, we do not look deeper into cards that are set to be replaced by a template.

Each card set to be templated should contain a key, and optionally some context that will be passed into the template/partials.

At this point, we update our copy of each dashboard YAML/JSON by swapping out any templates with a rendered value. After each dashboard has the cards inside of it updated, we submit a call on behalf of the user updating the entire YAML of the dashboard.

Once the user reloads the browser, the changes will be visible!
