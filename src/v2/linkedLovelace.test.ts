import LinkedLovelaceController from './linkedLovelace';

describe('[class] LinkedLovelaceController', () => {
  test('sets up as expected', () => {
    const controller = new LinkedLovelaceController();
    expect(controller).toBeDefined;
  });

  test('gets something with something when given an ID', () => {
    const controller = new LinkedLovelaceController();
    controller.templateController.templates
    controller.registerTemplates({'test': {
      type: 'test'
    }})
    expect(Object.keys(controller.templateController.templates)).toHaveLength(1)
  });
  
  
});
