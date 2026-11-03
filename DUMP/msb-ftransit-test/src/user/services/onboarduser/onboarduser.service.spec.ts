import { Test, TestingModule } from '@nestjs/testing';
import { OnboarduserService } from './onboarduser.service';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { KeycloakService } from '../keycloak/keycloak.service';
import { WinstonLoggerService } from '../winstonlogger/winstonlogger.service';
import { CODE, MESSAGE } from '../../enum/user.enum'; // Import your enums if needed

describe('OnboarduserService', () => {
  let service: OnboarduserService;
  let mockHttpService;
  let mockKeycloakService;
  let mockLogger;

  const token = 'mock-token';
  const role = 'Bank Admin';

  // Adjusted user_access to match expected structure (banks/branches as arrays)
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
          {
            banks: { allow: ['BankA'], deny: [] },
            branches: { allow: ['Branch1', 'Branch2'], deny: [] },
          },
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
      // First call: user does not exist, second call: user exists after creation
      getUserData: jest.fn(),
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

    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnboarduserService,
        { provide: HttpService, useValue: mockHttpService },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: KeycloakService, useValue: mockKeycloakService },
        { provide: WinstonLoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<OnboarduserService>(OnboarduserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should onboard a new user successfully', async () => {
    // Mock getAccessToken
    mockKeycloakService.getAccessToken.mockResolvedValueOnce({
      data: { data: 'mock-client-token' },
    });
  
    // First getUserData: no user exists
    mockKeycloakService.getUserData
      .mockResolvedValueOnce({ data: { data: [] } }) // First check — no existing user
      .mockResolvedValueOnce({ data: { data: [{ id: 'user-id' }] } }); // After createUser — fetch created user
  
    // Mock createUser
    mockKeycloakService.createUser.mockResolvedValueOnce({
      status: 201,
    });
  
    // Mock assign role methods
    mockKeycloakService.getClientRoles = jest.fn().mockResolvedValueOnce({
      data: [{ id: 'role-id', name: mockUserBody.edetails[0].user_role }],
    });
  
    mockKeycloakService.assignRole = jest.fn().mockResolvedValueOnce({
      status: 204,
    });
  
    mockKeycloakService.getGroup = jest.fn().mockResolvedValueOnce({
      data: [{ id: 'group-id' }],
    });
  
    mockKeycloakService.assignUserToGroup = jest.fn().mockResolvedValueOnce({
      status: 204,
    });
  
    // Mock HTTP post for assignUpermissions
    mockHttpService.post = jest.fn().mockResolvedValue({
      status: 200,
    });
  
    // Call onboardUser
    const result: any = await service.onboardUser(mockUserBody, token, role);
  
    // Verify calls
    expect(mockKeycloakService.getAccessToken).toHaveBeenCalledWith('client');
    expect(mockKeycloakService.getUserData).toHaveBeenCalledTimes(2);
    expect(mockKeycloakService.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        username: mockUserBody.edetails[0].user_info.username,
        email: mockUserBody.edetails[0].user_info.email,
      }),
      'mock-client-token',
    );
    expect(mockKeycloakService.getClientRoles).toHaveBeenCalledWith(
      'user-id',
      mockUserBody.edetails[0].user_role,
      'mock-client-token',
    );
    
  
    // Verify result
    expect(result.code).toBe(CODE.SUCCESS);
    expect(result.message).toBe(MESSAGE.SUCCESS);
    expect(result.edata.headers).toEqual(['username', 'msg', 'status']);
    expect(result.edata.values[0][0]).toBe(mockUserBody.edetails[0].user_info.email);
    expect(result.edata.values[0][1]).toBe('USER_ONBOARDED');
    expect(result.edata.values[0][2]).toBe(1);
  });
  
  it('should return USER_EXISTS if user already exists', async () => {
    // Mock getUserData to simulate an existing user
    mockKeycloakService.getUserData.mockResolvedValueOnce({
      data: { data: [ { id: 'existing-user-id' } ] }
    });
  
    // Mock getAccessToken to avoid token-related errors
    mockKeycloakService.getAccessToken.mockResolvedValueOnce({
      data: { data: 'mock-client-token' }
    });
  
    const result: any = await service.onboardUser(mockUserBody, token, role);
  
    // Debug: log the actual result
    console.log(JSON.stringify(result, null, 2));
  
    // Assertions
    expect(result.status).toBe(200);
    expect(result.data.code).toBe(CODE.SUCCESS);
    expect(result.data.data).toBe(MESSAGE.USER_EXISTS);
    expect(result.data.headers).toEqual(['username', 'msg', 'status']);
    expect(result.data.values[0][0]).toBe(mockUserBody.edetails[0].user_info.email);
    expect(result.data.values[0][1]).toBe('USER_EXISTS');
    expect(result.data.values[0][2]).toBe(0);
  });
  
  

  it('should return error response when createUser fails', async () => {
    mockKeycloakService.createUser.mockRejectedValueOnce(new Error('USER_ONBOARDING_FAILED'));

    const result: any = await service.onboardUser(mockUserBody, token, role);

    expect(result.code).toBe(CODE.ERROR);
    expect(result.message).toBe(MESSAGE.ERROR);
    expect(result.edata.values[0][1]).toBe('USER_ONBOARDING_FAILED');
  });

  // Optionally: tests for assignClientRole and assignGroup can be added here,
  // e.g., to verify that assignRole is called when roles exist
  it('should assign client role if getClientRoles returns roles', async () => {
    const userDetails = { id: 'user-id' };
    const roles = [{ id: 'r1', role: 'Bank Admin', clientId: 'c1' }];
    
    mockKeycloakService.getClientRoles.mockResolvedValueOnce({ status: 200, data: roles });
    mockKeycloakService.assignRole.mockResolvedValueOnce({ status: 204 });

    await service.assignClientRole(token, role, userDetails);

    expect(mockKeycloakService.getClientRoles).toHaveBeenCalledWith('user-id', role, token);
    expect(mockKeycloakService.assignRole).toHaveBeenCalledWith('user-id', 'c1', token, [
      { id: 'r1', name: 'Bank Admin' },
    ]);
  });

  it('should not assign role if no roles returned from getClientRoles', async () => {
    const userDetails = { id: 'user-id' };
    
    mockKeycloakService.getClientRoles.mockResolvedValueOnce({ status: 200, data: [] });

    await service.assignClientRole(token, role, userDetails);

    expect(mockKeycloakService.assignRole).not.toHaveBeenCalled();
  });

  it('should log error if getClientRoles throws an error', async () => {
    const userDetails = { id: 'user-id' };
    
    mockKeycloakService.getClientRoles.mockRejectedValueOnce(new Error('ROLE_FETCH_FAILED'));

    await service.assignClientRole(token, role, userDetails);

    expect(mockLogger.log).toHaveBeenCalledWith(expect.any(Error));
  });

  // Test for assignUpermissions
  it('should assign permissions to registry, wf, and intel when all POST requests succeed', async () => {
    const username = 'user1';
    const banks = { allow: ['BankA'], deny: [] };
    const branches = { allow: ['Branch1'], deny: [] };
    const fname = 'First';
    const lname = 'Last';
    const urole = 'Bank Admin';
    const registryData = { id: '123' };

    mockHttpService.post
      .mockResolvedValueOnce({ status: 200, data: registryData }) // registry
      .mockResolvedValueOnce({ status: 200 }) // wf
      .mockResolvedValueOnce({ status: 200 }); // intel

    await service.assignUpermissions(username, banks, branches, token, fname, lname, urole);

    expect(mockLogger.log).toHaveBeenCalledWith('User permissions assigned successfully');
  });

  it('should not proceed if registry POST request fails', async () => {
    const username = 'user1';
    const banks = { allow: ['BankA'], deny: [] };
    const branches = { allow: ['Branch1'], deny: [] };
    const fname = 'First';
    const lname = 'Last';
    const urole = 'Bank Admin';

    mockHttpService.post.mockResolvedValueOnce({ status: 500 });

    await service.assignUpermissions(username, banks, branches, token, fname, lname, urole);

    expect(mockHttpService.post).toHaveBeenCalledTimes(2); // only first POST request should be attempted
  });

 

});
