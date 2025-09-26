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
}
