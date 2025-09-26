import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  async findAll(
    @Query() params,
    @Query('name') name?: string,
    @Query('email') email?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : undefined;
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    const filters = {
      ...Object.fromEntries(
        Object.entries(params).filter(
          ([key]) => !['page', 'limit', 'name', 'email'].includes(key),
        ),
      ),
      ...(name && { name: { $regex: name, $options: 'i' } }),
      ...(email && { email: { $regex: email, $options: 'i' } }),
    };
    console.log(filters);
    return this.usersService.findAll(filters, limitNum, pageNum);
  }
}
