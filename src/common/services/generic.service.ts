export abstract class GenericService {
  constructor(protected repository) {}
  async create(enityData: unknown) {
    return this.repository.create(enityData);
  }
  async findAll(
    filter: any = {},
    limit?: number,
    page?: number,
    populate?: string[],
  ): Promise<{
    data;
    totalItems: number;
    currentPage?: number;
    limit?: number;
  }> {
    return this.repository.findAll(filter, limit, page, populate);
  }
  async findOne(filter: any = {}) {
    return this.repository.findOne(filter);
  }
  async findByIdAndUpdate(
    id: string,
    updateEntityData,
    resourceName = 'Entity Updated successfully.',
  ) {
    console.log(updateEntityData);
    const result = await this.repository.findByIdAndUpdate(
      id,
      updateEntityData,
      {
        new: true,
      },
    );
    console.log(result);
    return result;
  }

  async updateOne(filter, updated, options): Promise<unknown> {
    const result = await this.repository.updateOne(filter, updated, options);
    return result;
  }
}
