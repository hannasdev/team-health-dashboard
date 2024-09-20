import 'reflect-metadata';
import { Container } from 'inversify';

import { createMockLogger, createMockConfig } from '../../__mocks__';
import { JobQueueService } from '../../services/JobQueueService/JobQueueService';
import { TYPES } from '../../utils/types';

// Mock Agenda
jest.mock('agenda', () => {
  return jest.fn().mockImplementation(() => ({
    start: jest.fn().mockResolvedValue(undefined),
    schedule: jest.fn().mockResolvedValue(undefined),
    define: jest.fn(),
    stop: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
  }));
});

describe('JobQueueService', () => {
  let jobQueueService: JobQueueService;
  let mockLogger: ReturnType<typeof createMockLogger>;
  let mockConfig: ReturnType<typeof createMockConfig>;
  let mockAgenda: jest.Mocked<any>;
  let container: Container;

  beforeEach(() => {
    container = new Container();
    mockLogger = createMockLogger();
    mockConfig = createMockConfig();
    mockAgenda = new (jest.requireMock('agenda'))();

    container.bind(TYPES.Logger).toConstantValue(mockLogger);
    container.bind(TYPES.Config).toConstantValue(mockConfig);
    container.bind(JobQueueService).toSelf();

    jobQueueService = container.get(JobQueueService);
    (jobQueueService as any).agenda = mockAgenda;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should start the agenda and log success', async () => {
      await jobQueueService.initialize();
      expect(mockLogger.info).toHaveBeenCalledWith('Job queue initialized');
      expect(mockAgenda.start).toHaveBeenCalled();
    });

    it('should throw an error if agenda fails to start', async () => {
      mockAgenda.start.mockRejectedValue(new Error('Failed to start'));

      await expect(jobQueueService.initialize()).rejects.toThrow(
        'Failed to start',
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to initialize job queue:',
        expect.any(Error),
      );
    });
  });

  describe('scheduleJob', () => {
    it('should schedule a job and log success', async () => {
      await jobQueueService.scheduleJob('testJob', { data: 'test' });
      expect(mockLogger.info).toHaveBeenCalledWith('Job scheduled: testJob');
      expect(mockAgenda.schedule).toHaveBeenCalledWith('now', 'testJob', {
        data: 'test',
      });
    });

    it('should throw an error if scheduling fails', async () => {
      mockAgenda.schedule.mockRejectedValue(new Error('Scheduling failed'));

      await expect(jobQueueService.scheduleJob('testJob', {})).rejects.toThrow(
        'Scheduling failed',
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to schedule job testJob:',
        expect.any(Error),
      );
    });
  });

  describe('defineJob', () => {
    it('should define a job and log success', async () => {
      const handler = jest.fn();
      await jobQueueService.defineJob('testJob', handler);
      expect(mockLogger.info).toHaveBeenCalledWith('Job defined: testJob');
      expect(mockAgenda.define).toHaveBeenCalledWith('testJob', handler);
    });
  });

  describe('gracefulShutdown', () => {
    it('should stop the agenda and log success', async () => {
      await jobQueueService.gracefulShutdown();
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Job queue gracefully shut down',
      );
      expect(mockAgenda.stop).toHaveBeenCalled();
    });

    it('should throw an error if stopping fails', async () => {
      mockAgenda.stop.mockRejectedValue(new Error('Stop failed'));

      await expect(jobQueueService.gracefulShutdown()).rejects.toThrow(
        'Stop failed',
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to shut down job queue:',
        expect.any(Error),
      );
    });
  });
});
