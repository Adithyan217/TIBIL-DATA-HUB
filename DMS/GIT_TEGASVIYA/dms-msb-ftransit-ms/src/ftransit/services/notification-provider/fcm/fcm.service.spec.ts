import { FcmService } from './fcm.service';
import * as admin from 'firebase-admin';

// Mock path.join to always return our fake config path
jest.mock('path', () => ({
  join: jest.fn(() => '/mock/path/to/firebase.json'),
}));

// Mock the firebase config JSON
jest.mock('/mock/path/to/firebase.json', () => ({
  project_id: 'mock-project',
}), { virtual: true });

// Mock firebase-admin
jest.mock('firebase-admin', () => ({
  apps: [],
  initializeApp: jest.fn(),
  credential: { cert: jest.fn() },
  messaging: jest.fn(),
}));

describe('FcmService', () => {
  let service: FcmService;
  let mockSend: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSend = jest.fn();
    (admin.messaging as jest.Mock).mockReturnValue({ send: mockSend });
  });

  describe('constructor', () => {
    it('should initialize Firebase app if no apps exist', () => {
      (admin.apps as any).length = 0;
      service = new FcmService();
      expect(admin.initializeApp).toHaveBeenCalled();
      expect(admin.credential.cert).toHaveBeenCalled();
    });

    it('should not re-initialize if Firebase already initialized', () => {
      (admin.apps as any).length = 1;
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      service = new FcmService();
      expect(admin.initializeApp).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Firebase app already initialized');
    });
  });

  describe('sendPushNotification', () => {
    beforeEach(() => {
      (admin.apps as any).length = 1;
      service = new FcmService();
    });

    it('should return success: true when message is sent', async () => {
      mockSend.mockResolvedValueOnce('mock-response');
      const result = await service.sendPushNotification('token', 'Title', 'Body', { key: 'value' });
      expect(result).toEqual({ success: true, response: 'mock-response' });
    });

    it('should return success: false when messaging returns falsy value', async () => {
      mockSend.mockResolvedValueOnce(null);
      const result = await service.sendPushNotification('token', 'Title', 'Body');
      expect(result).toEqual({ success: false, msg: 'failed' });
    });

    it('should handle and return error when messaging throws', async () => {
      mockSend.mockRejectedValueOnce(new Error('Firebase error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const result = await service.sendPushNotification('token', 'Title', 'Body');
      expect(consoleSpy).toHaveBeenCalledWith('Error sending message:', expect.any(Error));
      expect(result).toEqual({ success: false, error: 'Firebase error' });
    });
  });
});
