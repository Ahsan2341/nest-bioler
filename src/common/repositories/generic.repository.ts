import { Document, Model } from 'mongoose';
import { NotFoundException } from '@nestjs/common';

export class GenericRepository<T extends Document> {
  protected readonly model: Model<T>;
  constructor(model: Model<T>) {
    this.model = model;
  }
  async create(entityData: unknown) {
    const enity = await this.model.create(entityData);
    return {
      data: enity,
      message: `Entity created successfully`,
      status: 201,
    };
  }

  async findAll(
    filter: any = {},
    limit?: number,
    page?: number,
  ): Promise<{ data: T[]; totalItems: number; currentPage?: number; limit?: number }> {
    const isPaginated = limit !== undefined && page !== undefined && limit > 0 && page > 0;

    if (isPaginated) {
      const skip = (page - 1) * limit;
      const [data, totalItems] = await Promise.all([
        this.model.find(filter).limit(limit).skip(skip).exec(),
        this.model.countDocuments(filter).exec(),
      ]);
      return {
        data,
        totalItems,
        currentPage: page,
        limit,
      };
    } else {
      const data = await this.model.find(filter).exec();
      const totalItems = data.length;
      return { data, totalItems };
    }
  }

  async findOne(filter:any={}){
    return this.model.findOne(filter);
  }
}
