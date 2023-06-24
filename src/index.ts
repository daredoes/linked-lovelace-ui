import {Eta} from 'eta';
const eta = new Eta();
// const res = eta.renderString('Hi, my name is <%= it.name %>', { name: "Ben" });
const res = eta.renderString("<%= it.name %>", { name: "Ben" });
console.log(res)

// Render a template

console.log(res); // Hi Ben!