import { Model, Document } from 'mongoose';

export type MockModel<T extends Document> = {
  [K in keyof Model<T>]: jest.Mock;
} & {
  find: jest.Mock;
  sort: jest.Mock;
  skip: jest.Mock;
  limit: jest.Mock;
  lean: jest.Mock;
  exec: jest.Mock;
};

export const createMockMongooseModel = <T extends Document>(): MockModel<T> => {
  const mockModel: Partial<MockModel<T>> = {
    find: jest.fn().mockReturnThis(),
    findOne: jest.fn().mockReturnThis(),
    findOneAndUpdate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn(),
    create: jest.fn(),
    insertMany: jest.fn(),
    updateOne: jest.fn(),
    deleteOne: jest.fn(),
    countDocuments: jest.fn(),
  };

  return mockModel as MockModel<T>;
};

export { createMockGitHubPullRequestModel } from './mockGitHubPullRequestModel';
export { createMockGoogleSheetsMetricModel } from './mockGoogleSheetsMetricModel';
