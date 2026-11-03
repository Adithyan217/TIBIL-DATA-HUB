import { Test, TestingModule } from '@nestjs/testing';
import { OnboarduserService } from './onboarduser.service';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { KeycloakService } from '../keycloak/keycloak.service';
import { WinstonLoggerService } from '../winstonlogger/winstonlogger.service';

describe('OnboarduserService', () => {
  let service: OnboarduserService;
  let mockHttpService;
  let mockKeycloakService;

  const token = 'mock-token';

  const mockUserBody = {
    edetails: [
      {
        user_info: {
          username: 'testuser',
          email: 'testuser@example.com',
          fname: 'Test',
          lname: 'User',
        },
        user_access: [
          { banks: 'BankA', branches: ['Branch1', 'Branch2'] },
        ],
        user_role: 'Bank Admin',
      },
    ],
  };

  beforeEach(async () => {
    mockHttpService = {
      post: jest.fn(() => of({ status: 200, data: {} })),
    };

    mockKeycloakService = {
      getAccessToken: jest.fn().mockResolvedValue({ data: { data: token } }),
      getUserData: jest.fn()
          .mockResolvedValueOnce({ data: [], code: 200 })  // user not found initially
          .mockResolvedValueOnce({ data: [{ id: 'user-id', name: 'testuser' }], code: 200 }), // after creation
      createUser: jest.fn().mockResolvedValue({ status: 201 }),
      getClientRoles: jest.fn().mockResolvedValue({
                                                    status: 200,
                                                    data: [
                                                      {
                                                        id: 'role-id',
                                                        role: 'Bank Admin',
                                                        clientId: 'client-id',
                                                      },
                                                    ],
                                                  }),
      assignRole: jest.fn().mockResolvedValue({ status: 204 }),
      getGroup: jest.fn().mockResolvedValue({ code: 2000, id: 'group-id' }),
      assignUserToGroup: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
                                                                   providers: [
                                                                     OnboarduserService,
                                                                     { provide: HttpService, useValue: mockHttpService },
                                                                     { provide: ConfigService, useValue: { get: jest.fn() } },
                                                                     { provide: KeycloakService, useValue: mockKeycloakService },
                                                                     {
                                                                       provide: WinstonLoggerService,
                                                                       useValue: {
                                                                         log: jest.fn(),
                                                                         error: jest.fn(),
                                                                       },
                                                                     },
                                                                   ],
                                                                 }).compile();

    service = module.get<OnboarduserService>(OnboarduserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should onboard a new user successfully', async () => {
    const result: any = await service.onboardUser(mockUserBody, token);

    expect(mockKeycloakService.getAccessToken).toHaveBeenCalledWith('client');
    expect(mockKeycloakService.createUser).toHaveBeenCalled();
    expect(mockKeycloakService.getUserData).toHaveBeenCalledTimes(2);
    expect(mockKeycloakService.getClientRoles).toHaveBeenCalled();
    expect(mockKeycloakService.assignRole).toHaveBeenCalled();
    expect(mockKeycloakService.getGroup).toHaveBeenCalled();
    expect(mockKeycloakService.assignUserToGroup).toHaveBeenCalled();
    expect(result.code).toBe(2000);
    expect(result.message).toBe('SUCCESSFULLY USER CREATED');
  });


  it('should return failure response when createUser fails', async () => {
    mockKeycloakService.getAccessToken.mockResolvedValueOnce({ data: { data: token } });
    mockKeycloakService.getUserData.mockResolvedValueOnce({ data: [], code: 200 });
    mockKeycloakService.createUser.mockRejectedValue(new Error('USER IS NOT CREATED'));

    const result: any = await service.onboardUser(mockUserBody, token);

    expect(result.message).toBe('USER IS NOT CREATED');
    expect(result.code).toBe(4000);
  });
});
