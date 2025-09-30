import { Injectable } from '@nestjs/common';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Wallet, WalletDocument } from './entities/wallet.entity';
import { Model } from 'mongoose';

@Injectable()
export class WalletService {
  constructor(@InjectModel(Wallet.name) readonly walletModel:Model<WalletDocument>){}
  async create(createWalletDto) {
    return await this.walletModel.create({...createWalletDto}) 
    
  }

  findAll() {
    return `This action returns all wallet`;
  }

  findOne(id: number) {
    return `This action returns a #${id} wallet`;
  }

  update(filter, updateWalletDto) {
    return this.walletModel.updateOne(filter, updateWalletDto);
  }

  remove(id: number) {
    return `This action removes a #${id} wallet`;
  }
}
