import { Test, TestingModule } from '@nestjs/testing';
import { KeycloakService } from './keycloak.service';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { WinstonLoggerService } from '../winstonlogger/winstonlogger.service';

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
    expect(res.code).toBe(200);
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

  it('should get group members', async () => {
    const getGroupSpy = jest.spyOn(service, 'getGroup').mockResolvedValue({ code: 2000, id: 'gid' });
    mockHttpService.get.mockReturnValue(of({ status: 200, data: [{ name: 'test' }] }));
    const res:any = await service.getGroupMember('group', 'token');
    expect(res.code).toBe(2000);
  });

  it('should handle failed group member fetch', async () => {
    const getGroupSpy = jest.spyOn(service, 'getGroup').mockResolvedValue({
                                                                            code: 2000,
                                                                            message: 'Organization does not exist',
                                                                          });

    const res:any = await service.getGroupMember('group', 'token');
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
});
