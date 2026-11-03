import { Test, TestingModule } from '@nestjs/testing';
import { NotificationProviderService } from './notification-provider.service';
import { FcmService } from './fcm/fcm.service';
import { Fcm } from 'src/ftransit/interfaces/notif.interface';
import { CODE, fmsgs, generateResponse } from '../enum/common_messages.enum';

describe('NotificationProviderService', () => {
  let service: NotificationProviderService;
  let mockFcmService: jest.Mocked<FcmService>;

  const notifBody: Fcm = {
    token: 'test-token',
    title: 'Test Title',
    body: 'Test Body',
    data: { key: 'value' },
    identifier: 'test-identifier', // required field
    context: 'test-context',       // required field
  };

  beforeEach(async () => {
    mockFcmService = {
      sendPushNotification: jest.fn(),
    } as unknown as jest.Mocked<FcmService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationProviderService,
        { provide: FcmService, useValue: mockFcmService },
      ],
    }).compile();

    service = module.get<NotificationProviderService>(NotificationProviderService);
  });

  describe('identifyNotificationRoute', () => {
    it('should return success response when FCM returns success: true', async () => {
      mockFcmService.sendPushNotification.mockResolvedValueOnce({ success: true });

      const result = await service.identifyNotificationRoute(notifBody);

      expect(mockFcmService.sendPushNotification).toHaveBeenCalledWith(
        'test-token',
        'Test Title',
        'Test Body',
        { key: 'value' }
      );
      expect(result).toEqual(
        generateResponse(200, CODE.SUCCESS, fmsgs.FIREBASE_NOTIF_SUCCESS_MSG)
      );
    });

    it('should return invalid response when FCM returns success: false', async () => {
      mockFcmService.sendPushNotification.mockResolvedValueOnce({ success: false });

      const result = await service.identifyNotificationRoute(notifBody);

      expect(result).toEqual(
        generateResponse(200, CODE.INVALID, fmsgs.FIREBASE_NOTIF_FAILURE_MSG)
      );
    });

    it('should return error response when FCM throws', async () => {
      mockFcmService.sendPushNotification.mockRejectedValueOnce(
        new Error('Something went wrong')
      );

      const result = await service.identifyNotificationRoute(notifBody);

      expect(result).toEqual(
        generateResponse(400, CODE.ERROR, fmsgs.COMMON_ERROR_MSG)
      );
    });
  });
});
