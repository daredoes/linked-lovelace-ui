// TODO: Replace this with template engine test to match mode-button-v2-test.yml to rendered output
import fs from 'fs'
import path from 'path'
import { TemplateEngine, Jinja2Engine } from './template-engine';

const selectOptionTemplate = fs.readFileSync(path.resolve(__dirname, 'selectOption.yml'), { encoding: 'utf-8' });
const selectActionTemplate = fs.readFileSync(path.resolve(__dirname, 'selectAction.json'), { encoding: 'utf-8' });
const modeToIconTemplate = fs.readFileSync(path.resolve(__dirname, 'modeToIcon.yml'), { encoding: 'utf-8' });
const modeToIconColorTemplate = fs.readFileSync(path.resolve(__dirname, 'modeToIconColor.yml'), { encoding: 'utf-8' });

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
    const result = TemplateEngine.instance.eta.renderString("<%= context.mode %>", { mode: "Off" })
    expect(result).toStrictEqual("Off")
  });

  test('processes Object to JSON to template to JSON to object', async () => {
    const stringified = JSON.stringify(jsonTemplateData)
    const result = TemplateEngine.instance.eta.renderString(stringified, { mode: "Off", entity: "input_select.test" })
    const parsed = JSON.parse(result)
    expect(parsed).toMatchObject(jsonExpectedData)
  });
});

describe('[class] Jinja2Engine', () => {
  let jinja2: Jinja2Engine;
  let mockedRenderString: jest.Mock;
  let mockedHass: jest.Mock;

  beforeEach(() => {
    jinja2 = new Jinja2Engine();

    // Mock Home Assistant API call service
    mockedHass = jest.fn(async (_method: string, _url: string, payload: string) => {
      return payload
    });

    // Mock renderString to simulate Jinja2 rendering for test context
    const originalRenderString = jinja2.renderString.bind(jinja2);
    mockedRenderString = jest.fn(async (template, _prepend) => {
      return originalRenderString(template, _prepend)
    });
    jinja2.hass = { callApi: mockedHass }; // Mock Home Assistant API
    jinja2.renderString = mockedRenderString;
    jinja2.macros = [];
  });

  test('loadMacro and getMacros', () => {
    jinja2.loadMacro('test_macro', 'Hello {{ name }}', ['name']);
    const macros = jinja2.getMacros();
    expect(macros).toContain('{% macro test_macro(name) -%}Hello {{ name }}{% endmacro -%}');
  });

  test('loadMacro handles macro with no args', () => {
    jinja2.loadMacro('no_args_macro', 'No args body');
    const macros = jinja2.getMacros();
    expect(macros).toContain('{% macro no_args_macro -%}No args body{% endmacro -%}');
  });

  test('loadMacro handles macro with multiple args', () => {
    jinja2.loadMacro('multi_args_macro', 'Args: {{ a }}, {{ b }}', ['a', 'b']);
    const macros = jinja2.getMacros();
    expect(macros).toContain('{% macro multi_args_macro(a, b) -%}Args: {{ a }}, {{ b }}{% endmacro -%}');
  });

  test('buildVars with string, number, boolean, array, and object', () => {
    const context = {
      str: 'foo',
      num: 42,
      bool: true,
      arr: ['a', 'b'],
      obj: { x: 1 }
    };
    const vars = jinja2.buildVars(context);
    expect(vars).toContain('{% set str="foo" -%}');
    expect(vars).toContain('{% set num=42 -%}');
    expect(vars).toContain('{% set bool=true -%}');
    expect(vars).toContain('{% set arr=["a", "b"] -%}');
    expect(vars).toContain('{% set obj={"x":1} -%}');
  });

  test('render constructs payload with vars and macros', async () => {
    jinja2.loadMacro('macro1', 'test', []);
    const context = { foo: 'bar' };
    const template = 'Body {{ foo }} {% include "macro1" %}';

    jinja2.hass = null; // Allow testing without a real Home Assistant instance
    const result = await jinja2.render(template, context);
    // The result should include the rendered template with context replaced
    expect(result).toContain('Body {{ foo }} {% include "macro1" %}');

    // Check if the mock received the correct arguments
    expect(mockedRenderString).toBeCalledWith(
      template,
      jinja2.buildVars(context) + '\n' + jinja2.getMacros()
    );

  });

  test('render handles nested objects with template strings', async () => {
    const context = { foo: 'bar', num: 42 };
    const input = {
      a: 'Hello {{ foo }}',
      b: 123,
      c: [
        'Num: {{ num }}',
        { d: 'Nested {{ foo }}' },
        {
          '{{ foo }} is here': 'Yes',
          'not a template key': "not a template value"
        }
      ],
      e: {
        f: 'Deep {{ num }}',
        g: false,
        123: 999, // number keys are processed as strings
      }
    };

    // The render function expects a string input, so we stringify the object
    await jinja2.render(JSON.stringify(input), context);

    const prepend = jinja2.buildVars(context) + '\n' + jinja2.getMacros();
    expect(mockedRenderString).toBeCalledWith('a', prepend);
    expect(mockedRenderString).toBeCalledWith('Hello {{ foo }}', prepend);
    expect(mockedRenderString).toBeCalledWith('b', prepend);
    expect(mockedRenderString).toBeCalledWith('c', prepend);
    expect(mockedRenderString).toBeCalledWith('Num: {{ num }}', prepend);
    expect(mockedRenderString).toBeCalledWith('d', prepend);
    expect(mockedRenderString).toBeCalledWith('Nested {{ foo }}', prepend);
    expect(mockedRenderString).toBeCalledWith('{{ foo }} is here', prepend);
    expect(mockedRenderString).toBeCalledWith('Yes', prepend);
    expect(mockedRenderString).toBeCalledWith('not a template key', prepend);
    expect(mockedRenderString).toBeCalledWith('not a template value', prepend);
    expect(mockedRenderString).toBeCalledWith('e', prepend);
    expect(mockedRenderString).toBeCalledWith('f', prepend);
    expect(mockedRenderString).toBeCalledWith('Deep {{ num }}', prepend);
    expect(mockedRenderString).toBeCalledWith('g', prepend);
    expect(mockedRenderString).toBeCalledWith('123', prepend);

    // Render string is called for every string key and value in the object
    expect(mockedRenderString).toBeCalledTimes(16);

    // The actual API should have only been called for the template strings
    expect(mockedHass).toBeCalledTimes(5);
  });

  test('render returns non-template values as-is', async () => {
    const context = { foo: 'bar' };
    const input = 12345;
    const result = await jinja2.render(JSON.stringify(input), context);
    expect(JSON.parse(result)).toBe(12345);
  });

  test('throws error on Jinja2 rendering failure', async () => {

    jinja2.hass = {
      callApi: jest.fn(async () => {
        throw new Error('API call failed');
      })
    };

    await expect(jinja2.render("{{ test }}", {})).
      rejects.toThrow('Failed to render Jinja2 template: Error: API call failed');
  });

});
