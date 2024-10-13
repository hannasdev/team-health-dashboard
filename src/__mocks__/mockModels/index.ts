import mongoose, { Model, Document } from 'mongoose';

export type MockModel<T extends mongoose.Document> = {
  [K in keyof mongoose.Model<T>]: jest.Mock;
} & {
  find: jest.Mock;
  findOne: jest.Mock;
  findOneAndUpdate: jest.Mock;
  updateOne: jest.Mock;
  deleteOne: jest.Mock;
  create: jest.Mock;
  insertMany: jest.Mock;
  countDocuments: jest.Mock;
  deleteMany: jest.Mock;
};

export const createMockMongooseModel = <
  T extends mongoose.Document,
>(): MockModel<T> => {
  const mockModel: Partial<MockModel<T>> = {
    find: jest.fn().mockReturnThis(),
    findOne: jest.fn().mockReturnThis(),
    findOneAndUpdate: jest.fn().mockReturnThis(),
    updateOne: jest.fn().mockReturnThis(),
    deleteOne: jest.fn().mockReturnThis(),
    create: jest.fn(),
    insertMany: jest.fn(),
    countDocuments: jest.fn(),
    deleteMany: jest.fn(),
  };

  return mockModel as MockModel<T>;
};

export { createMockGitHubPullRequestModel } from './mockGitHubPullRequestModel';
export { createMockGoogleSheetsMetricModel } from './mockGoogleSheetsMetricModel';
