import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { KeycloakService } from './keycloak/keycloak.service';
import { ConfigService } from '@nestjs/config';
import { WinstonLoggerService } from './winstonlogger/winstonlogger.service';
import { HttpService } from '@nestjs/axios';
import { OnboarduserService } from './onboarduser/onboarduser.service';
import { HttpException } from '@nestjs/common';
import { of } from 'rxjs';
import { CODE, MESSAGE } from '../enum/user.enum';

describe('UserService', () => {
  let service: UserService;
  let mockKeycloak: any;
  let mockLogger: any;
  let mockHttp: any;
  let mockOnboard: any;

  beforeEach(async () => {
    mockKeycloak = {
      getAccessToken: jest.fn(),
      getUserData: jest.fn(),
      getUserAssociatedClient: jest.fn(),
      getUserAssociatedGroup: jest.fn(),
      logout: jest.fn(),
      getAssocRolesForClient: jest.fn(),
      getGroupMember: jest.fn(),
      updateUserDetails: jest.fn(),
      getAvailableRole: jest.fn(),
      resetPassword: jest.fn(),
    };

    mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
      log: jest.fn(),
    };

    mockHttp = {
      post: jest.fn(),
      get: jest.fn(),
    };

    mockOnboard = {
      assignUpermissions: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: KeycloakService, useValue: mockKeycloak },
        { provide: WinstonLoggerService, useValue: mockLogger },
        { provide: HttpService, useValue: mockHttp },
        { provide: OnboarduserService, useValue: mockOnboard },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key) => {
              const map = {
                CLIENT_ID: 'client-id',
                CLIENT_UUID: 'client-uuid',
                AXIOS_URL: 'http://test-api',
                UI_CLIENT_UUID: 'ui-client-uuid',
              };
              return map[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  describe('Login', () => {
    it('should return error if password is missing', async () => {
      const result = await service.Login({ username: 'test' } as any);
      expect(result.data.message).toBe('PASSWORD REQUIRED');
    });

    it('should return error if username is missing', async () => {
      const result = await service.Login({ password: 'pass' } as any);
      expect(result.data.message).toBe('USERNAME IS REQUIRED');
    });

    it('should return access token on success', async () => {
      mockKeycloak.getAccessToken.mockResolvedValue({ data: 'access-token', status: 200 });
      const result = await service.Login({ username: 'test', password: 'pass' });
      expect(result.data).toBe('access-token');
    });

    it('should throw HttpException on error', async () => {
      mockKeycloak.getAccessToken.mockRejectedValue(new Error('Login failed'));
      await expect(service.Login({ username: 'test', password: 'pass' })).rejects.toThrowError(HttpException);
    });
  });

  describe('getUserDetails', () => {
    it('should return user details with role and group', async () => {
      mockKeycloak.getAccessToken.mockResolvedValue({ data: { data: 'client-token' } });
      mockKeycloak.getUserData.mockResolvedValueOnce({ data:{
        code: 2000,
        data: [
          {
            id: 'user-id',
            username: 'john',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            attributes: {},
          },
        ],
      }    
      });
      mockKeycloak.getUserAssociatedClient.mockResolvedValue({ data: [{ name: 'admin' }] });
      mockKeycloak.getUserAssociatedGroup.mockResolvedValue({ data: [{ name: 'dms' }] });

      const result: any = await service.getUserDetails({ username: 'john@example.com' });
      expect(result.data.code).toBe(2000);
      expect(result.data.data[0].username).toBe('john');
      expect(result.data.data[0].role).toBe('admin');
      expect(result.data.data[0].org).toBe('dms');
    });

    it('should return invalid user when user not found', async () => {
      mockKeycloak.getAccessToken.mockResolvedValue({ data: { data: 'token' } });
      mockKeycloak.getUserData.mockResolvedValue({ code: 200, data: [] });

      const result: any = await service.getUserDetails({ email: 'unknown@example.com' });
      expect(result.data.code).toBe(1000);
      expect(result.data.message).toBe('INVALID USER');
    });

    it('should return error when exception occurs', async () => {
      mockKeycloak.getAccessToken.mockRejectedValue(new Error('internal error'));
      const result: any = await service.getUserDetails({ email: 'error@example.com' });
      expect(result.status).toBe(500);
      expect(result.data.code).toBe(4000);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      mockKeycloak.logout.mockResolvedValue({ data: { message: 'User logged out successfully.' }, status: 200 });
      const result = await service.logout('token');
      expect(result.data.message).toBe('User logged out successfully.');
    });
  });

  describe('getRoles', () => {
    it('should return roles when successful', async () => {
      mockKeycloak.getAccessToken.mockResolvedValue({ data: { data: 'client-token' } });
      mockKeycloak.getAssocRolesForClient.mockResolvedValue({ status: 200, data: { data: ['admin', 'rm'] } });

      const result = await service.getRoles();
      expect(result.data.data).toContain('admin');
    });

    it('should handle no roles found case', async () => {
      mockKeycloak.getAccessToken.mockResolvedValue({ data: { data: 'token' } });
      mockKeycloak.getAssocRolesForClient.mockResolvedValue({ status: 404 });

      const result = await service.getRoles();
      expect(result.data.message).toBe('NO ROLES');
    });

    it('should handle exception in getRoles', async () => {
      mockKeycloak.getAccessToken.mockRejectedValue(new Error('DB down'));
      await expect(service.getRoles()).rejects.toThrow('DB down');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('forgotPassword', () => {
    it('should validate missing fields', async () => {
      const res1: any = await service.forgotPassword({ userName: 'abc' });
      expect(res1.data.message).toBe('NEW PASSWORD REQUIRED');

      const res2: any = await service.forgotPassword({ newPassword: 'abc' });
      expect(res2.data.message).toBe('USERNAME IS REQUIRED');
    });

    it('should return error for unknown user', async () => {
      mockKeycloak.getAccessToken.mockResolvedValue({ data: { data: 'token' } });
      mockKeycloak.getUserData.mockResolvedValue({status: 400, data:{code: 2000, data: []}  });

      const result: any = await service.forgotPassword({ newPassword: 'pass', username: 'john' });
      expect(result.data.message).toBe('INVALID USER');
    });

    it('should reset password successfully', async () => {
      mockKeycloak.getAccessToken.mockResolvedValue({ data: { data: 'token' } });
      mockKeycloak.getUserData.mockResolvedValue({ status: 200, data:{data: [{ id: 'user123' }]}  });
      mockKeycloak.resetPassword.mockResolvedValue({ status: 200, data:{code: 2000,  message: MESSAGE.PASSWORD_SUCCESS }});

      const result: any = await service.forgotPassword({ newPassword: 'pass', username: 'john' });
      expect(result.data.code).toBe(CODE.SUCCESS);
    });
   
    
    it('should handle internal error gracefully', async () => {
      mockKeycloak.getAccessToken.mockRejectedValue(new Error('unexpected'));

      const result: any = await service.forgotPassword({ username: 'john', newPassword: '123' });
      expect(result.data.code).toBe(4000);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  process.env.AXIOS_URL = 'http://test-api';

  describe('getUserListByOrg', () => {
    it('should return error if email is not provided', async () => {
      const result = await service.getUserListByOrg({}, { user: { role: 'DMS Admin' } }, 'token');
      expect(result).toEqual({
        status: 200,
        data: {
          code: 1000,
          message: 'EMAIL IS REQUIRED',
        },
      });
    });
  
    it('should return user list for valid request', async () => {
      const userList = [{ id: 1, username: 'john', firstName: 'John', lastName: 'Doe' }];
  
      // Mock access token correctly
      mockKeycloak.getAccessToken.mockResolvedValue({
        data: {
          data: 'mocked-client-access-token',
        },
      });
  
      // MOCK AVAILABLE ROLES as array of objects (not strings)
      mockKeycloak.getAvailableRole.mockResolvedValue({
        status: 200,
        data: {
          data: {
            AvailableRoles: JSON.stringify([
              { role: 'Bank Admin', action: 'ONBOARD_BANK_ADMIN' },
              { role: 'Bank RM', action: 'ONBOARD_BANK_RM' },
              // Add more roles if needed
            ]),
          },
        },
      });
  
      // Mock HTTP post returning user list

      mockHttp.post.mockReturnValue(
        of({
          data: {
            code: 2000,
            data: userList,
            count: 1,
          },
        }),
      );
      
  
      // Call the service with payload including pagination and context
      const result = await service.getUserListByOrg(
        {
          email: 'john@example.com',
          pagination: { offset: 0, limit: 10 },
          context: 'BANK',
          search: 'b', // optional, can omit if not used
        },
        { user: { role: 'DMS Admin' } },
        'mocked-token',
      );
  
      expect(result.status).toEqual(200);
      expect(result.data.code).toEqual(2000);
      expect(result.data.data).toEqual(userList);
      expect(result.data.count).toEqual(1);
  
      // Check HTTP call params
      expect(mockHttp.post).toHaveBeenCalledWith(
        'http://test-api/registry/users/list/get',
        {
          username: 'john@example.com',
          roles: ['Bank Admin', 'Bank RM'],
          context: 'BANK',
          search: 'b',  // or undefined if omitted
          offset: 0,
          limit: 10,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer mocked-token',
          },
        },
      );
    });
  
    it('should handle internal error and return 500', async () => {
      mockKeycloak.getAccessToken.mockRejectedValue(new Error('Internal Server Error'));
  
      const result = await service.getUserListByOrg(
        { email: 'john@example.com' },
        { user: { role: 'DMS Admin' } },
        'token',
      );
  
      expect(result).toEqual({
        status: 500,
        data: {
          code: 4000,
          message: 'Internal Server Error',
        },
      });
  
      expect(mockLogger.error).toHaveBeenCalledWith('Internal Server Error');
    });
  });
  
  
  
  

  describe('updateUserDetails', () => {
    const userId = 'user-123';

    it('should successfully update user details and return USER_UPDATED', async () => {
      const body = { userId: 'user-123', fname: 'NewFirst', lname: 'NewLast', enable: false };
      mockKeycloak.getAccessToken.mockResolvedValue({ data: { data: 'token' } });
      mockKeycloak.getUserData.mockResolvedValue({data:{ data: { id: userId, username: 'john' } }});
      mockKeycloak.updateUserDetails.mockResolvedValue({ status: 200 });

      const edata = {
        status: [1, 1, 0],
        values: [[body.userId, 'USER_UPDATED', 1]],
        headers: ['userId', 'msg', 'status'],
      };

      const result = await service.updateUserDetails(body, 'token');

      expect(result).toEqual({
        status: 200,
        data: {
          code: 2000,
          data: edata,
          edata: edata,
        },
      });
    });

    it('should call assignUpermissions when access_scope is provided', async () => {
      const body = {
        userId: 'user-123',
        fname: 'NewFirst',
        access_scope: { banks: { allow: ['bank1'], deny: [] }, branches: { allow: ['branch1'], deny: [] }, role: 'admin' },
      };
      mockKeycloak.getAccessToken.mockResolvedValue({ data: { data: 'token' } });
      mockKeycloak.getUserData.mockResolvedValue({ data: {data: { id: userId, username: 'john', firstName: 'John', lastName: 'Doe' } }});
      mockKeycloak.updateUserDetails.mockResolvedValue({ status: 200 });
      mockOnboard.assignUpermissions.mockResolvedValue({ status: 200 });

      const edata = {
        status: [1, 1, 0],
        values: [[body.userId, 'USER_UPDATED', 1]],
        headers: ['userId', 'msg', 'status'],
      };

      const result = await service.updateUserDetails(body, 'token');

      expect(mockOnboard.assignUpermissions).toHaveBeenCalledWith(
        'john',
        { allow: ['bank1'], deny: [] },
        { allow: ['branch1'], deny: [] },
        'token',
        'NewFirst',
        'Doe',
        'admin',
      );
      expect(result).toEqual({
        status: 200,
        data: {
          code: 2000,
          data: edata,
          edata: edata,
        },
      });
    });

    it('should return failure response if update API fails (non-200)', async () => {
      const body = { userId: 'user-123', fname: 'NewFirst', enable: false };
      mockKeycloak.getAccessToken.mockResolvedValue({ data: { data: 'token' } });
      mockKeycloak.getUserData.mockResolvedValue({data:{ data: { id: userId, username: 'john' } }});
      mockKeycloak.updateUserDetails.mockResolvedValue({ status: 500 });

      const edata = {
        status: [1, 0, 1],
        values: [[body.userId, 'USER_UPDATION_FAILED', 0]],
        headers: ['userId', 'msg', 'status'],
      };

      const result = await service.updateUserDetails(body, 'token');

      expect(result).toEqual({
        status: 200,
        data: {
          code: 4000,
          message: edata,
          edata: edata,
        },
      });
    });

    it('should handle exception and return USER_UPDATION_FAILED', async () => {
      const body = { userId: 'user-123', fname: 'FailingUser' };
      mockKeycloak.getAccessToken.mockRejectedValue(new Error('token error'));

      const edata = {
        status: [1, 0, 1],
        values: [[body.userId, 'USER_UPDATION_FAILED', 0]],
        headers: ['userId', 'msg', 'status'],
      };

      const result = await service.updateUserDetails(body, 'token');

      expect(result).toEqual({
        status: 400,
        data: {
          code: 4000,
          message: edata,
          edata: edata,
        },
      });
    });

    it('should handle USER_DEACTIVATION_FAILED for enable=true with exception', async () => {
      const body = { userId: 'user-123', enable: true };
      mockKeycloak.getAccessToken.mockRejectedValue(new Error('token error'));

      const edata = {
        status: [1, 0, 1],
        values: [[body.userId, 'USER_DEACTIVATION_FAILED', 0]],
        headers: ['userId', 'msg', 'status'],
      };

      const result = await service.updateUserDetails(body, 'token');

      expect(result).toEqual({
        status: 400,
        data: {
          code: 4000,
          message: edata,
          edata: edata,
        },
      });
    });
  });

  describe('searchUser', () => {
    const userId = 'user-123';
    const token = 'valid-token';
    const defaultUser = { id: 1, username: 'john', firstName: 'John', lastName: 'Doe' };

    it('should return error if orgname is not provided', async () => {
      const result = await service.searchUser(token, { userName: 'john' });
      expect(result).toEqual({
        status: 200,
        data: {
          code: 1000,
          message: 'INVALID USER',
        },
      });
    });

    it('should return error if userName is not provided', async () => {
      const result = await service.searchUser(token, { orgname: 'dms' });
      expect(result).toEqual({
        status: 200,
        data: {
          code: 1000,
          message: 'USERNAME IS REQUIRED',
        },
      });
    });

    it('should return error if userName is empty', async () => {
      const result = await service.searchUser(token, { orgname: 'dms', userName: '' });
      expect(result).toEqual({
        status: 200,
        data: {
          code: 1000,
          message: 'USERNAME IS REQUIRED',
        },
      });
    });

    it('should return user data for orgname "dms" with user found', async () => {
      mockKeycloak.getAccessToken.mockResolvedValue({ data: { data: 'token' } });
      mockKeycloak.getUserData
        .mockResolvedValueOnce({ data: 1 }) // count call
        .mockResolvedValueOnce({ data: [defaultUser] }); // user data

      const result = await service.searchUser(token, { orgname: 'dms', userName: 'john' });

      expect(result.status).toBe(200);
      expect(result.data.code).toBe(2000);
      expect(result.data.count).toBe(1);
      expect(result.data.data).toEqual([{ id: 1, username: 'john', firstName: 'John', lastName: 'Doe' }]);
    });

    it('should return "User Not Found" for orgname "dms" with count = 0', async () => {
      mockKeycloak.getAccessToken.mockResolvedValue({ data: { data: 'token' } });
      mockKeycloak.getUserData.mockResolvedValue({ data: 0 });

      const result = await service.searchUser(token, { orgname: 'dms', userName: 'john' });

      expect(result).toEqual({
        status: 200,
        data: {
          code: 4000,
          message: 'USER IS NOT CREATED',
        },
      });
    });

    it('should return matched users for non-dms org with matching usernames', async () => {
      const groupUsers = [
        { id: 1, username: 'john.doe', firstName: 'John', lastName: 'Doe' },
        { id: 2, username: 'alice.smith', firstName: 'Alice', lastName: 'Smith' },
      ];
      const matchedUsers = [{ id: 1, username: 'john.doe', firstName: 'John', lastName: 'Doe' }];

      mockKeycloak.getAccessToken.mockResolvedValue({ data: { data: 'token' } });
      mockKeycloak.getGroupMember.mockResolvedValue({ code: 2000, data: groupUsers });

      const result = await service.searchUser(token, { orgname: 'custom-group', userName: 'john' });

      expect(result.status).toBe(200);
      expect(result.data.code).toBe(2000);
      expect(result.data.data).toEqual(matchedUsers);
      expect(result.data.count).toBe(1);
    });

    it('should return 400 if groupMember API returns 4004', async () => {
      mockKeycloak.getAccessToken.mockResolvedValue({ data: { data: 'token' } });
      mockKeycloak.getGroupMember.mockResolvedValue({
        code: 4004,
        message: 'Group not found',
      });

      const result = await service.searchUser(token, { orgname: 'invalid-group', userName: 'any' });

      expect(result).toEqual({
        status: 400,
        data: {
          code: 4004,
          message: 'Group not found',
        },
      });
    });

    it('should handle internal error and return 500', async () => {
      mockKeycloak.getAccessToken.mockRejectedValue(new Error('token fetch error'));

      const result = await service.searchUser(token, { orgname: 'dms', userName: 'john' });

      expect(mockLogger.error).toHaveBeenCalledWith('token fetch error');
      expect(result).toEqual({
        status: 500,
        data: {
          code: 4000,
          message: 'token fetch error',
        },
      });
    });
  });

  describe('getUiRolePermisssions', () => {
    it('should return available roles when successful', async () => {
      mockKeycloak.getAccessToken.mockResolvedValue({ data: { data: 'client-token' } });
      mockKeycloak.getAvailableRole.mockResolvedValue({
        status: 200,
        data: { data: JSON.stringify([{ role: 'Bank Admin' }, { role: 'DMS Admin' }]) },
      });

      const result = await service.getUiRolePermisssions({ user: { role: 'admin' } });

      expect(result).toEqual({
        status: 200,
        data: {
          code: 2000,
          data: JSON.stringify([{ role: 'Bank Admin' }, { role: 'DMS Admin' }]),
        },
      });
      expect(mockKeycloak.getAvailableRole).toHaveBeenCalledWith('client-token', 'admin', undefined);
    });

    it('should handle error and return 400', async () => {
      mockKeycloak.getAccessToken.mockRejectedValue(new Error('Role fetch error'));

      const result = await service.getUiRolePermisssions({ user: { role: 'admin' } });

      expect(mockLogger.error).toHaveBeenCalledWith('Role fetch error');
      expect(result).toEqual({
        status: 400,
        data: {
          code: 4000,
          message: 'Role fetch error',
        },
      });
    });
  });

  describe('firebaseConfig', () => {
    afterEach(() => {
      delete process.env.FIREBASE_CONFIG; // cleanup after each test
    });

    it('should return firebase config if FIREBASE_CONFIG is set', async () => {
      const configObject = { projectId: 'abc', apiKey: 'xyz' };
      process.env.FIREBASE_CONFIG = JSON.stringify(configObject);

      const result = await service.firebaseConfig();

      expect(result).toEqual({
        status: 200,
        data: {
          code: 2000,
          data: configObject,
        },
      });
    });

    it('should return error response if FIREBASE_CONFIG is not set', async () => {
      delete process.env.FIREBASE_CONFIG;

      const result = await service.firebaseConfig();

      expect(result).toEqual({
        status: 400,
        data: {
          code: 4000,
          message: 'NO DATA',
        },
      });
    });

    it('should return error response if FIREBASE_CONFIG is invalid JSON', async () => {
      process.env.FIREBASE_CONFIG = '{invalid-json';

      const result = await service.firebaseConfig();

      expect(mockLogger.error).toHaveBeenCalled();
      expect(result.status).toBe(400);
      expect(result.data.code).toBe(4000);
    });
  });

  describe('getUserAvailableRoles', () => {
    it('should handle invalid JSON and return 400', async () => {
      mockKeycloak.getAccessToken.mockResolvedValue({ data: { data: 'client-token' } });
      mockKeycloak.getAvailableRole.mockResolvedValue({
        status: 200,
        data: { data: undefined },
      });
  
      const result = await service.getAttributesForRoles({ user: { role: 'admin' } }, 'role');
  
      expect(result).toEqual({
        status: 400,
        data: {
          code: 4000,
          message: "Cannot read properties of undefined (reading 'AvailableRoles')",
        },
      });
      expect(mockKeycloak.getAvailableRole).toHaveBeenCalledWith('client-token', 'admin');
    });
  });
});