// TODO: Replace this with template engine test to match mode-button-v2-test.yml to rendered output
import fs from 'fs'
import path from 'path'
import { TemplateEngine } from './template-engine';

const selectOptionTemplate = fs.readFileSync(path.resolve(__dirname, 'selectOption.yml'), { encoding: 'utf-8'});
const selectActionTemplate = fs.readFileSync(path.resolve(__dirname, 'selectAction.json'), { encoding: 'utf-8'});
const modeToIconTemplate = fs.readFileSync(path.resolve(__dirname, 'modeToIcon.yml'), { encoding: 'utf-8'});
const modeToIconColorTemplate = fs.readFileSync(path.resolve(__dirname, 'modeToIconColor.yml'), { encoding: 'utf-8'});

const jsonExpectedData = {
  type: 'test',
  cards: [
    {
      type: 'custom:mushroom-template-card',
      primary: '',
      secondary: 'Off',
      icon: 'mdi:power',
      entity: 'input_select.test',
      badge_color: 'green',
      tap_action: {
        action: 'call-service',
        service: 'input_select.select_option',
        data: {
          option: 'Off'
        },
        target: {
          entity_id: 'input_select.test',
        },
      },
      icon_color: 'red',
      fill_container: true,
      multiline_secondary: true
    }
  ]
}

const jsonTemplateData = {
  type: 'test',
  cards: [
    {
      type: 'custom:mushroom-template-card',
      primary: '',
      secondary: '<%=context.mode%>',
      icon: "<%~include('@modeToIcon', { ...context }) _%>",
      entity: '<%=context.entity%>',
      badge_color: 'green',
      tap_action: {
        action: 'call-service',
        service: 'input_select.select_option',
        data: {
          option: '<%=context.mode%>'
        },
        target: {
          entity_id: '<%=context.entity%>',
        },
      },
      icon_color: "<%~include('@modeToIconColor', { ...context }) _%>",
      fill_container: true,
      multiline_secondary: true

    }
  ]
}

describe('[class] templateEngine', () => {
  beforeEach(() => {
    TemplateEngine.instance.refresh();
    TemplateEngine.instance.eta.loadTemplate('@modeToIcon', modeToIconTemplate)
    TemplateEngine.instance.eta.loadTemplate('@modeToIconColor', modeToIconColorTemplate)
    TemplateEngine.instance.eta.loadTemplate('@selectOption', selectOptionTemplate)
    TemplateEngine.instance.eta.loadTemplate('@selectAction', selectActionTemplate)
  })
  test('processes basic string', async () => {
    const result = TemplateEngine.instance.eta.renderString("<%= context.mode %>", {mode: "Off"})
    expect(result).toStrictEqual("Off")
  });
 
  test('processes Object to JSON to template to JSON to object', async () => {
    const stringified = JSON.stringify(jsonTemplateData)
    const result = TemplateEngine.instance.eta.renderString(stringified, {mode: "Off", entity: "input_select.test"})
    const parsed = JSON.parse(result)
    expect(parsed).toMatchObject(jsonExpectedData)
  });
});
