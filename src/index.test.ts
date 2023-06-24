import {Eta} from 'eta';
const eta = new Eta();
// const res = eta.renderString('Hi, my name is <%= it.name %>', { name: "Ben" });
test('Check ETA', () => {
  const res = eta.renderString("<%= it.name %>", { name: "Ben" });
  expect(res).toStrictEqual("Ben")
})