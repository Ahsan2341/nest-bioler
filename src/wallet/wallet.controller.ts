import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  UseGuards,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { JwtGuards } from 'src/common/guards/jwt-guards';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}
  
  @UseGuards(JwtGuards)
  @Post()
  create(@Body() createWalletDto: CreateWalletDto, @Request() request) {
    const user = request.user;
    return this.walletService.create({ user: user._id, ...createWalletDto });
  }

  @Get()
  findAll() {
    return this.walletService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.walletService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateWalletDto: UpdateWalletDto) {
    return this.walletService.update(+id, updateWalletDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.walletService.remove(+id);
  }
}
