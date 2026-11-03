// otp-provider.service.spec.ts
import { OtpProviderService } from './otp-provider.service';
import { EmailOtpService } from './email-otp/email-otp.service';
import { CODE, fmsgs, generateResponse } from '../enum/common_messages.enum';

describe('OtpProviderService', () => {
  let service: OtpProviderService;
  let mockEmailOtpService: jest.Mocked<EmailOtpService>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockEmailOtpService = {
      sendOtp: jest.fn(),
    } as any;

    service = new OtpProviderService(mockEmailOtpService);
  });

  describe('extractAndRouteToOtpProvider', () => {
    it('should call processOtpRequest and return success response', async () => {
      const spyProcess = jest
        .spyOn(service, 'processOtpRequest')
        .mockResolvedValueOnce(
          generateResponse(200, CODE.SUCCESS, fmsgs.OTP_SUCCESS_MSG)
        );

      const body = { ftype: 'emailOtp', email: 'test@example.com', otp: '1234' };

      const result = await service.extractAndRouteToOtpProvider(body);

      expect(spyProcess).toHaveBeenCalledWith('emailOtp', {
        email: 'test@example.com',
        otp: '1234',
      });

      expect(result).toEqual(
        generateResponse(200, CODE.SUCCESS, fmsgs.OTP_SUCCESS_MSG)
      );
    });

    it('should return failure response if processOtpRequest throws', async () => {
      jest
        .spyOn(service, 'processOtpRequest')
        .mockImplementationOnce(() => {
          throw new Error('fail');
        });

      const body = { ftype: 'emailOtp', email: 'test@example.com', otp: '1234' };

      const result = await service.extractAndRouteToOtpProvider(body);

      expect(result).toEqual(
        generateResponse(400, CODE.ERROR, fmsgs.OTP_FAILURE_MSG)
      );
    });
  });

  describe('processOtpRequest', () => {
    it('should call the correct OTP provider method and return result', async () => {
      const mockResult = generateResponse(
        200,
        CODE.SUCCESS,
        fmsgs.OTP_SUCCESS_MSG
      );

      mockEmailOtpService.sendOtp.mockResolvedValueOnce(mockResult);

      const result = await service.processOtpRequest('emailOtp', {
        email: 'test@example.com',
        otp: '1234',
      });

      expect(mockEmailOtpService.sendOtp).toHaveBeenCalledWith(
        'test@example.com',
        '1234'
      );
      expect(result).toEqual(mockResult);
    });
  });
});
