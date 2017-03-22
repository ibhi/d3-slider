import slider from '../src/slider';

describe('slider: ', () => {
  it('Slider should be true', () => {
    expect(slider).toBeTruthy();
  });
  it('false should not be true', () => {
    expect(false).toBeFalsy();
  });
});
