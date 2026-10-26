import { Body, Controller, Get, Headers, Inject, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Cop31EventDto, CreateCop31EventDto, UpdateCop31EventDto } from './dto/cop31-event.dto';
import { Cop31Service } from './cop31.service';

@ApiTags('cop31')
@Controller()
export class Cop31Controller {
  constructor(@Inject(Cop31Service) private readonly cop31: Cop31Service) {}

  @Get('health') health() { return { status: 'ok' }; }
  @Get('public/cop31/events') listPublic() { return this.cop31.listPublic(); }
  @Get('public/cop31/events/:slug') getPublic(@Param('slug') slug: string) { return this.cop31.getPublic(slug); }

  @Get('cop31/events') listEditor(@Headers('x-cop31-editor-key') key?: string) { this.cop31.assertEditorKey(key); return this.cop31.listEditor(); }
  @Post('cop31/events') create(@Headers('x-cop31-editor-key') key: string | undefined, @Body() dto: CreateCop31EventDto) { this.cop31.assertEditorKey(key); return this.cop31.create(dto); }
  @Patch('cop31/events/:id') update(@Headers('x-cop31-editor-key') key: string | undefined, @Param('id') id: string, @Body() dto: UpdateCop31EventDto) { this.cop31.assertEditorKey(key); return this.cop31.update(id, dto); }
}
