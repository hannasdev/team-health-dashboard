import { IProgressTracker } from '@/interfaces';
import { createProgressCallback } from '@/services/progress/ProgressTracker';
import { ProgressTracker } from '@/services/progress/ProgressTracker';
import { Logger } from '@/utils/Logger';

describe('ProgressTracker', () => {
  let progressTracker: ProgressTracker;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    jest.useFakeTimers();
    mockLogger = { info: jest.fn() } as unknown as jest.Mocked<Logger>;
    progressTracker = new ProgressTracker(mockLogger);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('trackProgress', () => {
    it('should log progress at the specified interval', () => {
      progressTracker.trackProgress(50, 100, 'Processing');
      expect(mockLogger.info).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(500);
      progressTracker.trackProgress(75, 100, 'Processing');
      expect(mockLogger.info).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(500);
      progressTracker.trackProgress(90, 100, 'Processing');
      expect(mockLogger.info).toHaveBeenCalledTimes(2);
    });

    it('should always log progress when current equals total', () => {
      progressTracker.trackProgress(99, 100, 'Processing');
      expect(mockLogger.info).toHaveBeenCalledTimes(1);

      progressTracker.trackProgress(100, 100, 'Processing');
      expect(mockLogger.info).toHaveBeenCalledTimes(2);
    });
  });

  describe('setReportInterval', () => {
    it('should change the report interval', () => {
      progressTracker.setReportInterval(2000);

      progressTracker.trackProgress(50, 100, 'Processing');
      expect(mockLogger.info).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(1000);
      progressTracker.trackProgress(75, 100, 'Processing');
      expect(mockLogger.info).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(1000);
      progressTracker.trackProgress(90, 100, 'Processing');
      expect(mockLogger.info).toHaveBeenCalledTimes(2);
    });
  });
});

describe('createProgressCallback', () => {
  it('should create a callback function that calls trackProgress', () => {
    const mockTracker: IProgressTracker = {
      trackProgress: jest.fn(),
      setReportInterval: jest.fn(),
    };

    const callback = createProgressCallback(mockTracker);
    callback(50, 100, 'Processing');

    expect(mockTracker.trackProgress).toHaveBeenCalledWith(
      50,
      100,
      'Processing',
    );
  });
});
