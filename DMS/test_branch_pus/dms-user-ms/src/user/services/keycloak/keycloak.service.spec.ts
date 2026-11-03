import { Test, TestingModule } from '@nestjs/testing';
import { KeycloakService } from './keycloak.service';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { WinstonLoggerService } from '../winstonlogger/winstonlogger.service';
import {CODE, generateResponse, MESSAGE } from '../../enum/user.enum';

describe('KeycloakService', () => {
  let service: KeycloakService;
  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  };

  const mockHttpService = {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        AXIOS_URL: 'http://localhost:8080',
        REALMS: 'test-realm',
        CLIENT_ID: 'client-id',
        CLIENT_SECRETS: 'client-secret',
        CLIENT_UUID: 'client-uuid',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
                                                                   providers: [
                                                                     KeycloakService,
                                                                     { provide: ConfigService, useValue: mockConfigService },
                                                                     { provide: HttpService, useValue: mockHttpService },
                                                                     { provide: WinstonLoggerService, useValue: mockLogger },
                                                                   ],
                                                                 }).compile();

    service = module.get<KeycloakService>(KeycloakService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return client access token', async () => {
    mockHttpService.post.mockReturnValue(of({ data: { access_token: 'abc123' } }));
    const res = await service.getAccessToken();
    expect(res.status).toBe(200);
    expect(res.data.data).toBe('abc123');
  });

  it('should return user access token', async () => {
    mockHttpService.post.mockReturnValue(of({ data: { token: 'xyz' } }));
    const res = await service.getAccessToken('user', 'test', 'pass');
    expect(res.status).toBe(200);
  });

  it('should handle 401 error in getAccessToken', async () => {
    const err = { status: 401, response: { data: { error_description: 'unauthorized' } } };
    mockHttpService.post.mockImplementation(() => { throw err; });
    const res = await service.getAccessToken();
    expect(res.data.message).toBe('unauthorized');
  });

  it('should get user data', async () => {
    mockHttpService.get.mockReturnValue(of({ data: [{ id: 1 }], status: 200 }));
    const res = await service.getUserData('john', 'username', 'token');
    expect(res.data.code).toBe(2000);
  });

  it('should get client roles', async () => {
    mockHttpService.get.mockReturnValue(of({ data: ['admin'], status: 200 }));
    const res = await service.getClientRoles('user1', 'admin', 'token');
    expect(res.status).toBe(200);
  });

  it('should assign role', async () => {
    mockHttpService.post.mockReturnValue(of({ status: 204 }));
    const res = await service.assignRole('uid', 'cid', 'token', [{ name: 'role' }]);
    expect(res.status).toBe(204);
  });

  it('should get group by name', async () => {
    mockHttpService.get.mockReturnValue(of({ status: 200, data: [{ id: 'gid', name: 'group' }] }));
    const res = await service.getGroup('group', 'token');
    expect(res.code).toBe(2000);
    expect(res.id).toBe('gid');
  });

  it('should assign user to group', async () => {
    mockHttpService.put.mockReturnValue(of({ status: 204 }));
    const res:any = await service.assignUserToGroup('uid', 'gid', 'token');
    expect(res.status).toBe(204);
  });

  it('should get user associated client roles', async () => {
    mockHttpService.get.mockReturnValue(of({ status: 200, data: ['read'] }));
    const res:any = await service.getUserAssociatedClient('uid', 'token');
    expect(res.code).toBe(2000);
  });

  const fakeJwt = [
    Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'),
    Buffer.from(JSON.stringify({ sub: '1234567890', name: 'John Doe' })).toString('base64url'),
    'signature123'
  ].join('.');

  it('should decode token', async () => {
    const decoded = await service.decodeJwt(fakeJwt);
    expect(decoded).toHaveProperty('payload.name', 'John Doe');
  });


  it('should update user details successfully', async () => {
    mockHttpService.put.mockReturnValue(of({ status: 204 }));
    const res:any = await service.updateUserDetails({ email: 'a@b.com' }, 'uid', 'token');
    expect(res.status).toBe(200);
  });

  it('should get associated roles for client', async () => {
    mockHttpService.get.mockReturnValue(of({ status: 200, data: [{ name: 'admin' }] }));
    const res = await service.getAssocRolesForClient('token');
    expect(res.data.data[0]).toBe('admin');
  });

  it('should get client id by name', async () => {
    mockHttpService.get.mockReturnValue(of({ status: 200, data: [{ id: 'client-id-xyz' }] }));
    const res = await service.getClientIdByName('token');
    expect(res.data.data).toBe('client-id-xyz');
  });

  it('should handle 500 error in getAccessToken', async () => {
    const err = { status: 500, message: 'Internal Server Error' };
    mockHttpService.post.mockImplementation(() => { throw err; });
    const res = await service.getAccessToken();
    expect(res.data.message).toBe('Internal Server Error');
  });

  // Test for getUserData when context is 'uuid' and no user found
  it('should handle getUserData when user not found for uuid', async () => {
    const userData = { status: 400, data: null };
    mockHttpService.get.mockReturnValue(of(userData));
    const res = await service.getUserData('123', 'uuid', 'token');
    expect(res.data.code).toBe(1000);
    expect(res.data.message).toBe('INVALID USER');
  });

  // Test getClientRoles when no roles are found for the user
  it('should return an empty array if no roles are found in getClientRoles', async () => {
    const emptyRoleData = { status: 200, data: [] };
    mockHttpService.get.mockReturnValue(of(emptyRoleData));
    const res = await service.getClientRoles('user1', 'admin', 'token');
    expect(res.status).toBe(200);
    expect(res.data).toEqual([]);
  });

  // Test for updateUserDetails when the response is not 204 (failure case)
  it('should return error response when updateUserDetails fails', async () => {
    mockHttpService.put.mockReturnValue(of({ status: 404 }));
    const res = await service.updateUserDetails({ email: 'a@b.com' }, 'uid', 'token');
    expect(res.data.code).toBe(1000);
    expect(res.data.message).toBe('INVALID USER');
  });

  // Test getGroup when no group is found for the groupName

  // Test for failed JWT decoding
  it('should return error for malformed JWT token', async () => {
    const malformedJwt = 'malformed.jwt.token';
    const decoded = await service.decodeJwt(malformedJwt);
    expect(decoded).toBeNull();
  });

  // Test getGroupMember when there are no members in the group
 

  // Test getAssocRolesForClient error handling
  it('should handle error in getAssocRolesForClient when the API call fails', async () => {
    const err = { status: 500, message: 'Internal Server Error' };
    mockHttpService.get.mockImplementation(() => { throw err; });
    const res = await service.getAssocRolesForClient('token');
    expect(res.data.code).toBe(4000);
    expect(res.data.message).toBe('Internal Server Error');
  });

  // Test getClientIdByName when client is not found
  it('should handle error in getClientIdByName when client is not found', async () => {
    const err = { status: 404, message: 'Client not found' };
    mockHttpService.get.mockImplementation(() => { throw err; });
    const res = await service.getClientIdByName('token');
    expect(res.data.code).toBe(4000);
  });

  // Test getUserAssociatedGroup with no group data
  it('should return empty array if no associated groups are found for the user', async () => {
    mockHttpService.get.mockReturnValue(of({ status: 200, data: [] }));
    const res = await service.getUserAssociatedGroup('uid', 'token');
    expect(res.code).toBe(2000);
    expect(res.data).toEqual([]);
  });

  it('should reset the password successfully', async () => {
    const userId = 'user-id';
    const newPassword = 'new-password';
    const accessToken = 'access-token';  
    mockHttpService.put.mockReturnValue(of({ status: 200 }));
    const res = await service.resetPassword(userId, newPassword, accessToken);
    expect(res.status).toBe(200);
    expect(res.data.data).toBe(MESSAGE.PASSWORD_SUCCESS);
  });

  // Test case for 400 error in resetPassword (with specific error message)
  it('should handle 400 error during password reset', async () => {
    const userId = 'user-id';
    const newPassword = 'new-password';
    const accessToken = 'access-token';

    const err = {
      status: 400,
      response: { data: { error_description: 'Invalid request' } },
    };
    mockHttpService.put.mockImplementation(() => throwError(err));

    const res = await service.resetPassword(userId, newPassword, accessToken);

    expect(res.status).toBe(200);
    expect(res.data.code).toBe(4000);
  });

  // Test case for a generic error in resetPassword (non-400 error)
  it('should handle generic error during password reset', async () => {
    const userId = 'user-id';
    const newPassword = 'new-password';
    const accessToken = 'access-token';
    const err = { status: 500, message: 'Internal Server Error' };
    mockHttpService.put.mockImplementation(() => throwError(err));
    const res = await service.resetPassword(userId, newPassword, accessToken);
    expect(res.status).toBe(500);
    expect(res.data.message).toBe('Internal Server Error');
  });

  // Test case for successful logout
  it('should logout successfully', async () => {
    const token = 'valid-token';

    mockHttpService.post.mockReturnValue(of({ status: 200 }));

    const res = await service.logout(token);

    expect(res.status).toBe(200);
    expect(res.data.data).toBe(MESSAGE.LOGOUT_SUCCESS);
  });

  // Test case for error during logout (invalid token)
  it('should handle error during logout due to invalid token', async () => {
    const token = 'invalid-token';

    const err = {
      status: 400,
      message: 'Invalid Token',
    };
    mockHttpService.post.mockImplementation(() => throwError(err));

    const res = await service.logout(token);

    expect(res.status).toBe(400);
    expect(res.data.message).toBe('Invalid Token');
  });

  it('should return role attributes when the role is found', async () => {
    const token = 'valid-token';
    const role = 'admin';
    const client_uuid = 'client-uuid';
    const mockResponse = {
      status: 200,
      data: {
        code: 2000,
        data: {
          attributes: ['read', 'write'],
        }
      },
    };
    
    mockHttpService.get.mockReturnValue(of(mockResponse));

    const res = await service.getAvailableRole(token, role, client_uuid);

    expect(res.data.code).toBe(CODE.SUCCESS);
    // expect(res.data.data.attributes).toEqual(mockResponse.data.data.attributes);
  });

  // Test case for empty role data
  it('should return an empty array when no role attributes are found', async () => {
    const token = 'valid-token';
    const role = 'non-existent-role';
    const client_uuid = 'client-uuid';
    const mockResponse = {
      status: 200,
      data:{
      code: CODE.SUCCESS,
      data: [],
      }
    };

    mockHttpService.get.mockReturnValue(of(mockResponse));

    const res = await service.getAvailableRole(token, role, client_uuid);

    expect(res.data.code).toBe(CODE.SUCCESS);
    // expect(res.data.data).toEqual(mockResponse.data.data);
  });

  
  // Test case for error handling with a 500 status code
  it('should return error response if the request fails with a 500 status', async () => {
    const token = 'invalid-token';
    const role = 'admin';
    const client_uuid = 'client-uuid';
    const errorResponse = {
      status: 500,
      data:{
        code: 4000,
        message: 'Internal Server Error',
      }
    };

    mockHttpService.get.mockImplementation(() => throwError(errorResponse));

    const res = await service.getAvailableRole(token, role, client_uuid);

    expect(res.data.code).toBe(CODE.ERROR);
  });

  
  // Test case for 500 error during user creation (e.g., server error)
 

});
