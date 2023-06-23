import { Eta } from 'eta';

const instance = new Eta()
// instance.configure({
//   varName: 'context',
//   autoEscape: false,
// });
console.log(Object.keys(instance))
export const engine =  instance;
