// TODO: Replace this with template engine test to match mode-button-v2-test.yml to rendered output
import fs from 'fs'
import path from 'path'
import { TemplateEngine } from './template-engine';

const text = fs.readFileSync(path.resolve(__dirname, 'test.yml'), 'UTF-8');
const template = fs.readFileSync(path.resolve(__dirname, 'testv2.yml'), 'UTF-8');
const selectOptionTemplate = fs.readFileSync(path.resolve(__dirname, 'selectOption.yml'), 'UTF-8');
const modeToIconTemplate = fs.readFileSync(path.resolve(__dirname, 'modeToIcon.yml'), 'UTF-8');
const modeToIconColorTemplate = fs.readFileSync(path.resolve(__dirname, 'modeToIconColor.yml'), 'UTF-8');


const instance = TemplateEngine.instance
instance.eta.loadTemplate('@modeToIcon', modeToIconTemplate)
instance.eta.loadTemplate('@modeToIconColor', modeToIconColorTemplate)
instance.eta.loadTemplate('@selectOption', selectOptionTemplate)
const result = instance.eta.renderString(template, { mode: 'Off', 'entity_id': 'input_select.test' })

console.log(result === text);
