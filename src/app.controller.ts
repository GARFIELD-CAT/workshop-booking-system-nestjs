import { createReadStream } from 'node:fs';

import { Controller, Get, Header, StreamableFile } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';

@Controller()
export class AppController {
  @Get('schema/redoc')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @ApiExcludeEndpoint()
  getRedoc(): string {
    return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <title>Workshop Booking API — ReDoc</title>
  </head>
  <body>
    <redoc spec-url="/api/schema/"></redoc>
    <script src="./redoc.standalone.js"></script>
  </body>
</html>`;
  }

  @Get('schema/redoc/redoc.standalone.js')
  @ApiExcludeEndpoint()
  getRedocScript(): StreamableFile {
    const scriptPath = require.resolve('redoc/bundles/redoc.standalone.js');

    return new StreamableFile(createReadStream(scriptPath), {
      type: 'application/javascript; charset=utf-8',
    });
  }
}
