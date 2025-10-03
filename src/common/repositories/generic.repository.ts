import {
  Document,
  FilterQuery,
  Model,
  QueryOptions,
  UpdateQuery,
  UpdateWithAggregationPipeline,
} from 'mongoose';
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
    populate?: string[],
  ): Promise<{
    data: T[];
    totalItems: number;
    currentPage?: number;
    limit?: number;
  }> {
    const isPaginated =
      limit !== undefined && page !== undefined && limit > 0 && page > 0;
    // Build the query
    let query = this.model.find(filter);

    // Apply population if provided
    if (populate && Array.isArray(populate) && populate.length > 0) {
      for (const field of populate) {
        query = query.populate(field.trim());
      }
    }
    // Apply pagination if provided
    if (isPaginated) {
      const skip = (page - 1) * limit;
      query = query.limit(limit).skip(skip);
    }

    // Execute the query
    const [data, totalItems] = await Promise.all([
      query.exec(),
      this.model.countDocuments(filter).exec(),
    ]);
    return {
      data,
      totalItems,
      ...(isPaginated ? { currentPage: page, limit } : {}),
    };
  }
  async findById(id:string){
    return this.model.findById(id);
  }
  async findByIdAndUpdate(
    id: string,
    updateEntityData: UpdateQuery<unknown>,
  ): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, updateEntityData, {
      new: true,
    });
  }
  async findOneAndUpdate(filter, updateEntityData) {
    return this.model.findOneAndUpdate(filter, updateEntityData);
  }
  async findOne(filter: any = {}) {
    return this.model.findOne(filter);
  }

  async updateOne(
    filter: FilterQuery<T>,
    updated: UpdateWithAggregationPipeline | UpdateQuery<T>,
    options?: QueryOptions,
  ): Promise<unknown> {
    return this.model.updateOne(filter, updated);
  }

  async updateMany(filter, updateEntityData){
    return this.model.updateMany(filter, updateEntityData);
  }
}
