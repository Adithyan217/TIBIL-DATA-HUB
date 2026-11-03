import { Test, TestingModule } from '@nestjs/testing';
import { MsbUserService } from './msb-user.service';
import { KeycloakService } from '../keycloak/keycloak.service';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { WinstonLoggerService } from '../winstonlogger/winstonlogger.service';
import { OnboarduserService } from '../onboarduser/onboarduser.service';
import { queryService } from '../query/query.service';
import { CODE, MESSAGE } from '../../enum/user.enum';
import { of } from 'rxjs';
import { Pool } from 'pg';

describe('MsbUserService', () => {
  let service: MsbUserService;
  let mockKeycloakService: any;
  let mockHttpService: any;
  let mockConfigService: any;
  let mockLogger: any;
  let mockQueryService: any;
  let mockPool: any;
  let mockOnboardService: any;

  beforeEach(async () => {
    mockKeycloakService = {
      getAccessToken: jest.fn(),
      getUserData: jest.fn(),
    };

    mockHttpService = {
      post: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn().mockReturnValue('test'),
    };

    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    };

    mockQueryService = {
      addOtpfactor: jest.fn().mockResolvedValue('insert otp'),
      validateOtpFactor: jest.fn().mockResolvedValue('validate otp'),
      addFactorToken: jest.fn().mockResolvedValue('add factor'),
      getFactorToken: jest.fn().mockResolvedValue('get factor'),
    };

    mockPool = {
      query: jest.fn().mockResolvedValue({ rowCount: 1, rows: [{ fval: 'ftoken' }] }),
    };

    mockOnboardService = {
      defaultPassword: 'defaultPass123',
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MsbUserService,
        { provide: KeycloakService, useValue: mockKeycloakService },
        { provide: HttpService, useValue: mockHttpService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: WinstonLoggerService, useValue: mockLogger },
        { provide: queryService, useValue: mockQueryService },
        { provide: OnboarduserService, useValue: mockOnboardService },
        { provide: 'DATABASE_POOL', useValue: mockPool },
      ],
    }).compile();

    service = module.get<MsbUserService>(MsbUserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('getUserInitToken success', async () => {
    mockKeycloakService.getAccessToken.mockResolvedValue({ status: 200, data: { data: 'token' } });
    const result = await service.getUserInitToken();
    expect(result.status).toBe(200);
    expect(result.data.code).toBe(CODE.SUCCESS);
  });

  it('getUserInitToken failure', async () => {
    mockKeycloakService.getAccessToken.mockRejectedValue(new Error('fail'));
    const result = await service.getUserInitToken();
    expect(result.status).toBe(400);
    expect(result.data.code).toBe(CODE.ERROR);
  });

  it('initiateRegistrationForMsbUser user exists', async () => {
    mockKeycloakService.getAccessToken.mockResolvedValue({ data: { data: 'client-token' } });
    mockKeycloakService.getUserData.mockResolvedValue({ data: { code: CODE.SUCCESS } });
    jest.spyOn(service, 'generateOtpAndSend').mockResolvedValue({ status: 200 });
    const result = await service.initiateRegistrationForMsbUser('idf', 'token', 'email');
    expect(service.generateOtpAndSend).toHaveBeenCalled();
    expect(result.status).toBe(200);
  });

  it('initiateRegistrationForMsbUser user not found', async () => {
    mockKeycloakService.getAccessToken.mockResolvedValue({ data: { data: 'client-token' } });
    mockKeycloakService.getUserData.mockResolvedValue({ data: { code: CODE.INVALID } });
    jest.spyOn(service, 'checkForIdentifier').mockResolvedValue({ status: 200 });
    const result = await service.initiateRegistrationForMsbUser('idf', 'token', 'email');
    expect(service.checkForIdentifier).toHaveBeenCalled();
    expect(result.status).toBe(200);
  });

  it('checkForIdentifier success', async () => {
    mockHttpService.post.mockReturnValue(of({ status: 200, data: { data: [{ allocated_merchant: 'Merchant' }] } }));
    jest.spyOn(service, 'processOnboarding').mockResolvedValue({ status: 200 });
    const result = await service.checkForIdentifier('idf', 'token', 'email');
    expect(service.processOnboarding).toHaveBeenCalled();
    expect(result.status).toBe(200);
  });

  it('checkForIdentifier not found', async () => {
    mockHttpService.post.mockReturnValue(of({ status: 200, data: { data: [] } }));
    const result = await service.checkForIdentifier('idf', 'token', 'email');
    expect(result.data.code).toBe(CODE.INVALID);
  });

  it('processOnboarding success', async () => {
    mockHttpService.post.mockReturnValue(of({ status: 201, data: {} }));
    jest.spyOn(service, 'generateOtpAndSend').mockResolvedValue({ status: 200 });
    const result = await service.processOnboarding('idf', 'name', 'token', 'email');
    expect(result.status).toBe(200);
  });

  it('processOnboarding failure', async () => {
    mockHttpService.post.mockReturnValue(of({ status: 400, data: {} }));
    const result = await service.processOnboarding('idf', 'name', 'token', 'email');
    expect(result.status).toBe(400);
  });

  it('generateOtpAndSend success', async () => {
    mockKeycloakService.getAccessToken.mockResolvedValue({ data: { data: 'client-token' } });
    mockKeycloakService.getUserData.mockResolvedValue({ data: { code: CODE.SUCCESS } });
    mockHttpService.post.mockReturnValue(of({ status: 200 }));
    const result = await service.generateOtpAndSend('idf', 'token', 'email');
    expect(result.data.code).toBe(CODE.SUCCESS);
  });

  it('generateOtpAndSend retry fails', async () => {
    mockKeycloakService.getAccessToken.mockResolvedValue({ data: { data: 'client-token' } });
    mockKeycloakService.getUserData.mockResolvedValue({ data: { code: CODE.INVALID } });
    jest.spyOn(service, 'retryWithDelay').mockResolvedValue(null);
    const result = await service.generateOtpAndSend('idf', 'token', 'email', true);
    expect(result.data.code).toBe(CODE.INVALID);
  });

  it('validateOtp valid', async () => {
    mockKeycloakService.getAccessToken.mockResolvedValue({
      data: { code: CODE.SUCCESS, data: { token: 'usertoken' } }
    });
    const result = await service.validateOtp('idf', 'otp');
    expect(result.data.code).toBe(CODE.SUCCESS);
    expect(result.data.data.token).toBe('usertoken');
  });

  it('validateOtp invalid', async () => {
    mockPool.query.mockResolvedValue({ rowCount: 0 });
    const result = await service.validateOtp('idf', 'otp');
    expect(result.data.code).toBe(CODE.INVALID);
  });

  it('addFactorToken success', async () => {
    const result = await service.addFactorToken('idf', 'token', 'type');
    expect(result.data.code).toBe(CODE.SUCCESS);
  });

  it('addFactorToken failure', async () => {
    mockPool.query.mockResolvedValue({ rowCount: 0 });
    const result = await service.addFactorToken('idf', 'token', 'type');
    expect(result.data.code).toBe(CODE.INVALID);
  });

  it('sendNotification success', async () => {
    mockHttpService.post.mockReturnValue(of({ status: 200 }));
    const result = await service.sendNotification({
      identifier: 'idf',
      context: 'otp',
      payload: { title: 'Title', body: 'Body', data: {} }
    }, 'token');
    expect(result.data.code).toBe(CODE.SUCCESS);
  });

  it('setupSubscriptionToDevice success', async () => {
    mockHttpService.post.mockReturnValue(of({ status: 200 }));
    const result = await service.setupSubscriptionToDevice('imei', 'mfname', 'token');
    expect(result.data.code).toBe(CODE.SUCCESS);
  });

  it('setupSubscriptionToDevice failure', async () => {
    mockHttpService.post.mockReturnValue(of({ status: 400 }));
    const result = await service.setupSubscriptionToDevice('imei', 'mfname', 'token');
    expect(result.data.code).toBe(CODE.INVALID);
  });

  it('retryWithDelay success first try', async () => {
    const taskFn = jest.fn().mockResolvedValue('result');
    const validateFn = jest.fn().mockReturnValue(true);
    const result = await service.retryWithDelay(taskFn, validateFn, 2, 10, mockLogger);
    expect(result).toBe('result');
  });

  it('retryWithDelay fails all retries', async () => {
    const taskFn = jest.fn().mockRejectedValue(new Error('fail'));
    const validateFn = jest.fn().mockReturnValue(false);
    const result = await service.retryWithDelay(taskFn, validateFn, 2, 10, mockLogger);
    expect(result).toBeNull();
  });

  it('should log and handle error in getUserInitToken', async () => {
    mockKeycloakService.getAccessToken.mockRejectedValue(new Error('Simulated error'));
    await service.getUserInitToken();
    expect(mockLogger.error).toHaveBeenCalledWith('Simulated error');
  });
  
  it('should log and handle error in initiateRegistrationForMsbUser', async () => {
    mockKeycloakService.getAccessToken.mockRejectedValue(new Error('initReg error'));
    await service.initiateRegistrationForMsbUser('idf', 'token', 'email');
    expect(mockLogger.error).toHaveBeenCalledWith('initReg error');
  });
  
  it('should log failure in processOnboarding', async () => {
    mockHttpService.post.mockReturnValue(of({ status: 400, data: {} }));
    await service.processOnboarding('idf', 'name', 'token', 'email');
    expect(mockLogger.error).toHaveBeenCalledWith('Onboarding request failed');
  });
  
 
  
  
  it('should log invalid OTP in validateOtp', async () => {
    mockPool.query.mockResolvedValue({ rowCount: 0 });
    await service.validateOtp('idf', 'otp');
    expect(mockLogger.error).toHaveBeenCalledWith('Invalid OTP');
  });
  
  it('should log failure to get access token in validateOtp', async () => {
    mockKeycloakService.getAccessToken.mockResolvedValue({
      data: { code: CODE.INVALID }
    });
    mockPool.query.mockResolvedValue({ rowCount: 1 });
    await service.validateOtp('idf', 'otp');
    expect(mockLogger.error).toHaveBeenCalledWith('Failed to get access token');
  });
  
  it('should log error in addFactorToken', async () => {
    mockPool.query.mockRejectedValue(new Error('addFactor error'));
    await service.addFactorToken('idf', 'token', 'ftype');
    expect(mockLogger.error).toHaveBeenCalledWith('addFactor error');
  });
  
  it('should log failure in addFactorToken (no insert)', async () => {
    mockPool.query.mockResolvedValue({ rowCount: 0 });
    await service.addFactorToken('idf', 'token', 'ftype');
    expect(mockLogger.error).toHaveBeenCalledWith('Failed to add factor token');
  });
  
  it('should log error in setupSubscriptionToDevice', async () => {
    mockHttpService.post.mockImplementation(() => { throw new Error('setup error') });
    await service.setupSubscriptionToDevice('imei', 'mfname', 'token');
    expect(mockLogger.error).toHaveBeenCalledWith('setup error');
  });
  
  it('should log all attempts failed in retryWithDelay', async () => {
    const taskFn = jest.fn().mockRejectedValue(new Error('fail'));
    const validateFn = jest.fn().mockReturnValue(false);
    await service.retryWithDelay(taskFn, validateFn, 2, 1, mockLogger);
    expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('All 2 attempts failed.'));
  });
  
  it('should log error on attempt in retryWithDelay', async () => {
    const taskFn = jest.fn().mockRejectedValue(new Error('fail attempt'));
    const validateFn = jest.fn().mockReturnValue(false);
    await service.retryWithDelay(taskFn, validateFn, 1, 1, mockLogger);
    expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('Error on attempt 1: fail attempt'));
  });

  it('should log all attempts failed in retryWithDelay', async () => {
    const taskFn = jest.fn().mockRejectedValue(new Error('fail'));
    const validateFn = jest.fn().mockReturnValue(false);
    await service.retryWithDelay(taskFn, validateFn, 2, 1, mockLogger);
    expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('All 2 attempts failed.'));
  });
  
  it('should handle no factor token found for identifier', async () => {
    // Mock DB query to return no rows
    mockPool.query.mockResolvedValue({ rows: [] });
  
    const result = await service.sendNotification({
      identifier: 'idf',
      context: 'otp',
      payload: { title: 'Title', body: 'Body', data: {} }
    }, 'token');
  
    expect(mockLogger.error).toHaveBeenCalledWith('No factor token found for identifier');
    expect(result.data.code).toBe(CODE.INVALID);
    expect(result.data.message).toBe(MESSAGE.INVALID);
  });
  
  it('should handle error in sendNotification', async () => {
    // Force an error in query
    mockPool.query.mockRejectedValue(new Error('DB error'));
  
    const result = await service.sendNotification({
      identifier: 'idf',
      context: 'otp',
      payload: { title: 'Title', body: 'Body', data: {} }
    }, 'token');
  
    expect(mockLogger.error).toHaveBeenCalledWith('DB error');
    expect(result.status).toBe(400);
    expect(result.data.code).toBe(CODE.ERROR);
  });
  
  
});
