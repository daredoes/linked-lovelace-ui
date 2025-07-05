import { walkViewForTemplates } from './walkViewForTemplates';
import { defaultLinkedLovelaceUpdatableConstants } from '../../constants';

describe('walkViewForTemplates', () => {
  const onTemplateObject = jest.fn((card) => {
    return card;
  });

  beforeEach(() => {
    onTemplateObject.mockClear();
  });

  it('should find a single template card at the top level', () => {
    const view = { [defaultLinkedLovelaceUpdatableConstants.isTemplateKey]: 'template1' };
    const result = walkViewForTemplates(view, onTemplateObject, defaultLinkedLovelaceUpdatableConstants.isTemplateKey);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ [defaultLinkedLovelaceUpdatableConstants.isTemplateKey]: 'template1'});
    expect(onTemplateObject).toHaveBeenCalledTimes(1);
  });

  it('should return an empty array when no templates are found', () => {
    const view = { type: 'vertical-stack', cards: [{ type: 'button-card' }] };
    const result = walkViewForTemplates(view, onTemplateObject, defaultLinkedLovelaceUpdatableConstants.isTemplateKey);
    expect(result).toHaveLength(0);
    expect(onTemplateObject).not.toHaveBeenCalled();
  });

  it('should find a single template card in a sectional view', () => {
    const view = {
        "title": "Home",
        "sections": [
            {
                "type": "grid",
                "cards": [
                    {
                        "type": "heading",
                        "heading": "New section"
                    },
                    {
                        [defaultLinkedLovelaceUpdatableConstants.isTemplateKey]: "clock",
                        "clock_size": "large",
                        "show_seconds": false,
                        "type": "clock",
                        "title": "<%= context.title %>"
                    }
                ]
            }
        ]
    }
    const result = walkViewForTemplates(view, onTemplateObject, defaultLinkedLovelaceUpdatableConstants.isTemplateKey);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
        [defaultLinkedLovelaceUpdatableConstants.isTemplateKey]: "clock",
        "clock_size": "large",
        "show_seconds": false,
        "type": "clock",
        "title": "<%= context.title %>"
    });
    expect(onTemplateObject).toHaveBeenCalledTimes(1);
  })
});
