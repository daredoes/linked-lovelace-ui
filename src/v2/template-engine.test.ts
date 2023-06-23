// TODO: Replace this with template engine test to match mode-button-v2-test.yml to rendered output
import fs from 'fs'
import path from 'path'
import { engine } from './engine';
import { Eta } from 'eta';

const text = fs.readFileSync(path.resolve(__dirname, 'test.yml'), 'UTF-8');
const template = fs.readFileSync(path.resolve(__dirname, 'testv2.yml'), 'UTF-8');
const selectOptionTemplate = fs.readFileSync(path.resolve(__dirname, 'selectOption.yml'), 'UTF-8');
const modeToIconTemplate = fs.readFileSync(path.resolve(__dirname, 'modeToIcon.yml'), 'UTF-8');
const modeToIconColorTemplate = fs.readFileSync(path.resolve(__dirname, 'modeToIconColor.yml'), 'UTF-8');

describe('[class] templateEngine', () => {
  test('empty array returns empty map of Dashboards', async () => {
    expect(Eta).toBeCalled
    // console.log(result === text);
  });
});

// engine.loadTemplate('@modeToIcon', modeToIconTemplate)
// engine.loadTemplate('@modeToIconColor', modeToIconColorTemplate)
// engine.loadTemplate('@selectOption', selectOptionTemplate)
