import { AppController } from './app.controller';

describe('AppController', () => {
  const appController = Object.create(AppController.prototype) as AppController;

  it('loads the ReDoc client from the local application', () => {
    const html = appController.getRedoc();

    expect(html).toContain('src="./redoc.standalone.js"');
    expect(html).not.toContain('https://cdn.redoc.ly');
  });
});
